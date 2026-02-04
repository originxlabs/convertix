using System.Security.Cryptography;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace PdfEditor.Api.Services;

public sealed class UserStore
{
    private readonly string _connectionString;
    private bool _schemaVerified;

    public UserStore(IConfiguration configuration)
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

    private async Task EnsureUserSchemaAsync()
    {
        if (_schemaVerified) return;
        await using var conn = OpenConnection();
        const string sql = @"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'password_hash' AND Object_ID = Object_ID(N'dbo.users'))
BEGIN
  ALTER TABLE dbo.users ADD password_hash VARBINARY(256) NOT NULL CONSTRAINT df_users_password_hash DEFAULT 0x;
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'password_salt' AND Object_ID = Object_ID(N'dbo.users'))
BEGIN
  ALTER TABLE dbo.users ADD password_salt VARBINARY(64) NOT NULL CONSTRAINT df_users_password_salt DEFAULT 0x;
END";
        await using var cmd = new SqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync();
        _schemaVerified = true;
    }

    public async Task<(string UserId, string Email)?> GetByEmailAsync(string email)
    {
        await EnsureUserSchemaAsync();
        const string sql = "SELECT user_id, email FROM users WHERE email = @email;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("email", email);
        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }
        return (reader.GetString(0), reader.GetString(1));
    }

    public async Task<(string UserId, string Email, byte[] Hash, byte[] Salt)?> GetAuthByEmailAsync(string email)
    {
        await EnsureUserSchemaAsync();
        const string sql = "SELECT user_id, email, password_hash, password_salt FROM users WHERE email = @email;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("email", email);
        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return (
            reader.GetString(0),
            reader.GetString(1),
            (byte[])reader["password_hash"],
            (byte[])reader["password_salt"]
        );
    }

    public async Task<(string UserId, string Email)> CreateUserAsync(string email, string password, string? orgId)
    {
        await EnsureUserSchemaAsync();
        var userId = Guid.NewGuid().ToString("N");
        var salt = RandomNumberGenerator.GetBytes(32);
        var hash = HashPassword(password, salt);

        await using var conn = OpenConnection();
        await using var transaction = await conn.BeginTransactionAsync();

        var effectiveOrgId = string.IsNullOrWhiteSpace(orgId)
            ? Guid.NewGuid().ToString("N")
            : orgId;

        const string orgExistsSql = "SELECT 1 FROM orgs WHERE org_id = @org_id;";
        await using (var checkCmd = new SqlCommand(orgExistsSql, conn, (SqlTransaction)transaction))
        {
            checkCmd.Parameters.AddWithValue("org_id", effectiveOrgId);
            var exists = await checkCmd.ExecuteScalarAsync();
            if (exists is null)
            {
                const string insertOrgSql = @"
INSERT INTO orgs (org_id, name, plan_tier)
VALUES (@org_id, @name, @plan_tier);";
                await using var insertOrgCmd = new SqlCommand(insertOrgSql, conn, (SqlTransaction)transaction);
                insertOrgCmd.Parameters.AddWithValue("org_id", effectiveOrgId);
                insertOrgCmd.Parameters.AddWithValue("name", $"{email.Split('@')[0]}'s workspace");
                insertOrgCmd.Parameters.AddWithValue("plan_tier", "free");
                await insertOrgCmd.ExecuteNonQueryAsync();
            }
        }

        const string userSql = @"
INSERT INTO users (user_id, org_id, email, password_hash, password_salt)
VALUES (@user_id, @org_id, @email, @hash, @salt);";
        await using (var cmd = new SqlCommand(userSql, conn, (SqlTransaction)transaction))
        {
            cmd.Parameters.AddWithValue("user_id", userId);
            cmd.Parameters.AddWithValue("org_id", (object?)effectiveOrgId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("email", email);
            cmd.Parameters.AddWithValue("hash", hash);
            cmd.Parameters.AddWithValue("salt", salt);
            await cmd.ExecuteNonQueryAsync();
        }

        const string memberSql = @"
IF NOT EXISTS (SELECT 1 FROM org_members WHERE user_id = @user_id)
INSERT INTO org_members (user_id, org_id, role)
VALUES (@user_id, @org_id, 'owner');";
        await using (var memberCmd = new SqlCommand(memberSql, conn, (SqlTransaction)transaction))
        {
            memberCmd.Parameters.AddWithValue("user_id", userId);
            memberCmd.Parameters.AddWithValue("org_id", effectiveOrgId);
            await memberCmd.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();
        return (userId, email);
    }

    public static byte[] HashPassword(string password, byte[] salt)
    {
        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
        return pbkdf2.GetBytes(32);
    }

    public static bool VerifyPassword(string password, byte[] salt, byte[] expectedHash)
    {
        var computed = HashPassword(password, salt);
        return CryptographicOperations.FixedTimeEquals(computed, expectedHash);
    }
}
