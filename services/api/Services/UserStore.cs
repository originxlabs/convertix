using System.Security.Cryptography;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace PdfEditor.Api.Services;

public sealed class UserStore
{
    private readonly string _connectionString;

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

    public async Task<(string UserId, string Email)?> GetByEmailAsync(string email)
    {
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
        var userId = Guid.NewGuid().ToString("N");
        var salt = RandomNumberGenerator.GetBytes(32);
        var hash = HashPassword(password, salt);

        const string sql = @"
INSERT INTO users (user_id, org_id, email, password_hash, password_salt)
VALUES (@user_id, @org_id, @email, @hash, @salt);";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("org_id", (object?)orgId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("email", email);
        cmd.Parameters.AddWithValue("hash", hash);
        cmd.Parameters.AddWithValue("salt", salt);
        await cmd.ExecuteNonQueryAsync();
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
