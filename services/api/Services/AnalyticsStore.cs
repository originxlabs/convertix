using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace PdfEditor.Api.Services;

public sealed class AnalyticsStore
{
    private readonly string _connectionString;
    private bool _schemaVerified;

    public AnalyticsStore(IConfiguration configuration)
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

    private async Task EnsureSchemaAsync()
    {
        if (_schemaVerified) return;
        await using var conn = OpenConnection();
        const string sql = @"
IF OBJECT_ID(N'dbo.visit_counters', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.visit_counters (
    counter_key NVARCHAR(128) NOT NULL PRIMARY KEY,
    total_count BIGINT NOT NULL CONSTRAINT df_visit_counters_total DEFAULT 0,
    updated_at DATETIME2 NOT NULL CONSTRAINT df_visit_counters_updated DEFAULT SYSUTCDATETIME()
  );
END";
        await using var cmd = new SqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync();
        _schemaVerified = true;
    }

    public async Task<long> IncrementCounterAsync(string key)
    {
        await EnsureSchemaAsync();
        const string sql = @"
IF EXISTS (SELECT 1 FROM dbo.visit_counters WHERE counter_key = @key)
BEGIN
  UPDATE dbo.visit_counters
  SET total_count = total_count + 1,
      updated_at = SYSUTCDATETIME()
  WHERE counter_key = @key;
END
ELSE
BEGIN
  INSERT INTO dbo.visit_counters (counter_key, total_count, updated_at)
  VALUES (@key, 1, SYSUTCDATETIME());
END
SELECT total_count FROM dbo.visit_counters WHERE counter_key = @key;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("key", key);
        var result = await cmd.ExecuteScalarAsync();
        return result is long count ? count : Convert.ToInt64(result ?? 0);
    }

    public async Task<long> GetCounterAsync(string key)
    {
        await EnsureSchemaAsync();
        const string sql = "SELECT total_count FROM dbo.visit_counters WHERE counter_key = @key;";
        await using var conn = OpenConnection();
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("key", key);
        var result = await cmd.ExecuteScalarAsync();
        return result is long count ? count : Convert.ToInt64(result ?? 0);
    }
}
