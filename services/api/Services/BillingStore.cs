using System.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace PdfEditor.Api.Services;

public sealed class BillingStore
{
    private readonly string _connectionString;

    public BillingStore(IConfiguration configuration)
    {
        _connectionString = configuration["AZURE_SQL_CONNECTION"]
            ?? throw new InvalidOperationException("AZURE_SQL_CONNECTION missing");
    }

    private SqlConnection OpenConnection()
    {
        var conn = new SqlConnection(_connectionString);
        conn.Open();
        return conn;
    }

    public async Task<List<TierInfo>> GetTiersAsync()
    {
        const string sql = "SELECT tier, name, description FROM tiers ORDER BY sort_order;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        var tiers = new List<TierInfo>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tiers.Add(new TierInfo(
                reader.GetString(0),
                reader.GetString(1),
                reader.GetString(2)
            ));
        }
        return tiers;
    }

    public async Task<List<PricingInfo>> GetPricingAsync(string? userId)
    {
        const string sql = "SELECT tier, price_monthly, price_yearly, currency FROM pricing ORDER BY sort_order;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        var pricing = new List<PricingInfo>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            pricing.Add(new PricingInfo(
                reader.GetString(0),
                reader.GetDecimal(1),
                reader.GetDecimal(2),
                reader.GetString(3)
            ));
        }
        return pricing;
    }

    public async Task<UserEntitlement?> GetUserEntitlementAsync(string userId)
    {
        const string sql = "SELECT tier, expires_at, org_id FROM user_entitlements WHERE user_id = @user_id;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }
        return new UserEntitlement(
            reader.GetString(0),
            reader.IsDBNull(1) ? null : reader.GetDateTime(1),
            reader.IsDBNull(2) ? null : reader.GetString(2)
        );
    }

    public async Task<ActivationRecord?> GetActivationByKeyAsync(string activationKey)
    {
        const string sql = "SELECT activation_key_hash, tier, expires_at, org_id, grace_period_days FROM license_keys WHERE activation_key_hash = @hash AND is_active = true;";
        var hash = HashActivationKey(activationKey);
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("hash", hash);
        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }
        return new ActivationRecord(
            reader.GetString(0),
            reader.GetString(1),
            reader.IsDBNull(2) ? null : reader.GetDateTime(2),
            reader.IsDBNull(3) ? null : reader.GetString(3),
            reader.GetInt32(4)
        );
    }

    public async Task<string> CreateActivationKeyAsync(string tier, DateTime? expiresAt, string? orgId, int graceDays)
    {
        var activationKey = $"CVX-{Guid.NewGuid():N}".ToUpperInvariant();
        var hash = HashActivationKey(activationKey);
        const string sql = @"
INSERT INTO license_keys (activation_key_hash, tier, expires_at, org_id, grace_period_days, is_active)
VALUES (@hash, @tier, @expires_at, @org_id, @grace_days, true);";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("hash", hash);
        cmd.Parameters.AddWithValue("tier", tier);
        cmd.Parameters.AddWithValue("expires_at", (object?)expiresAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("org_id", (object?)orgId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("grace_days", graceDays);
        await cmd.ExecuteNonQueryAsync();
        return activationKey;
    }

    public async Task MarkActivationUsedAsync(string activationHash, string userId, string deviceId)
    {
        const string sql = "UPDATE license_keys SET last_used_at = now(), last_user_id = @user_id, last_device_id = @device_id WHERE activation_key_hash = @hash;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("hash", activationHash);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("device_id", deviceId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task InsertUsageAsync(string userId, string feature, int amount, string monthKey)
    {
        const string sql = "INSERT INTO usage_events (user_id, feature, amount, month_key) VALUES (@user_id, @feature, @amount, @month_key);";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("feature", feature);
        cmd.Parameters.AddWithValue("amount", amount);
        cmd.Parameters.AddWithValue("month_key", monthKey);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<decimal> GetCreditBalanceAsync(string userId)
    {
        const string sql = "SELECT balance FROM credits_wallet WHERE user_id = @user_id;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        var result = await cmd.ExecuteScalarAsync();
        return result is null ? 0 : Convert.ToDecimal(result);
    }

    public async Task<decimal> AddCreditsAsync(string userId, decimal amount, string reason)
    {
        const string upsert = @"
IF EXISTS (SELECT 1 FROM credits_wallet WHERE user_id = @user_id)
BEGIN
  UPDATE credits_wallet SET balance = balance + @amount WHERE user_id = @user_id;
END
ELSE
BEGIN
  INSERT INTO credits_wallet (user_id, balance) VALUES (@user_id, @amount);
END";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(upsert, conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("amount", amount);
        await cmd.ExecuteNonQueryAsync();

        const string log = "INSERT INTO credit_events (user_id, amount, reason) VALUES (@user_id, @amount, @reason);";
        await using var logCmd = new SqlCommand(log, conn);
        logCmd.Parameters.AddWithValue("user_id", userId);
        logCmd.Parameters.AddWithValue("amount", amount);
        logCmd.Parameters.AddWithValue("reason", reason);
        await logCmd.ExecuteNonQueryAsync();

        return await GetCreditBalanceAsync(userId);
    }

    public async Task<decimal> ConsumeCreditsAsync(string userId, decimal amount, string reason)
    {
        const string sql = "UPDATE credits_wallet SET balance = balance - @amount WHERE user_id = @user_id AND balance >= @amount;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("amount", amount);
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0)
        {
            throw new InvalidOperationException("insufficient credits");
        }

        const string log = "INSERT INTO credit_events (user_id, amount, reason) VALUES (@user_id, @amount, @reason);";
        await using var logCmd = new SqlCommand(log, conn);
        logCmd.Parameters.AddWithValue("user_id", userId);
        logCmd.Parameters.AddWithValue("amount", -amount);
        logCmd.Parameters.AddWithValue("reason", reason);
        await logCmd.ExecuteNonQueryAsync();

        return await GetCreditBalanceAsync(userId);
    }

    public static string HashActivationKey(string key)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(key));
        return Convert.ToBase64String(bytes);
    }
}

public record TierInfo(string Tier, string Name, string Description);
public record PricingInfo(string Tier, decimal PriceMonthly, decimal PriceYearly, string Currency);
public record UserEntitlement(string Tier, DateTime? ExpiresAt, string? OrgId);
public record ActivationRecord(string ActivationHash, string Tier, DateTime? ExpiresAt, string? OrgId, int GracePeriodDays);
