using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace PdfEditor.Api.Services;

public sealed class TokenRevocationStore
{
    private readonly string _connectionString;

    public TokenRevocationStore(IConfiguration configuration)
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

    public async Task<bool> IsRevokedAsync(string jti)
    {
        const string sql = "SELECT 1 FROM token_revocations WHERE jti = @jti;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("jti", jti);
        var result = await cmd.ExecuteScalarAsync();
        return result is not null;
    }

    public async Task RevokeAsync(string jti, DateTime expiresAt)
    {
        const string sql = @"
IF NOT EXISTS (SELECT 1 FROM token_revocations WHERE jti = @jti)
BEGIN
  INSERT INTO token_revocations (jti, expires_at)
  VALUES (@jti, @expires_at)
END";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("jti", jti);
        cmd.Parameters.AddWithValue("expires_at", expiresAt);
        await cmd.ExecuteNonQueryAsync();
    }
}
