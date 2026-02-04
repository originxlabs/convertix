using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PdfEditor.Api.Services;

public sealed record SchemaReport(
    IReadOnlyList<string> MissingTables,
    IReadOnlyDictionary<string, IReadOnlyList<string>> MissingColumns
);

public sealed class SchemaValidator
{
    private readonly string? _connectionString;
    private readonly ILogger<SchemaValidator> _logger;

    private static readonly string[] RequiredTables =
    [
        "orgs",
        "users",
        "org_members",
        "tiers",
        "pricing",
        "org_subscriptions",
        "user_entitlements",
        "billing_snapshots"
    ];

    private static readonly string[] RequiredUserColumns =
    [
        "user_id",
        "org_id",
        "email",
        "password_hash",
        "password_salt"
    ];

    public SchemaValidator(IConfiguration configuration, ILogger<SchemaValidator> logger)
    {
        _connectionString = configuration["AZURE_SQL_CONNECTION"];
        _logger = logger;
    }

    public async Task<(bool Ok, string Message, SchemaReport Report)> ValidateAsync()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            return (false, "AZURE_SQL_CONNECTION missing.",
                new SchemaReport(Array.Empty<string>(), new Dictionary<string, IReadOnlyList<string>>()));
        }

        try
        {
            await using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            var tableList = string.Join(", ", RequiredTables.Select(t => $"'{t}'"));
            var tableSql = $"SELECT name FROM sys.tables WHERE name IN ({tableList});";
            var foundTables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            await using (var cmd = new SqlCommand(tableSql, conn))
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    foundTables.Add(reader.GetString(0));
                }
            }

            var missingTables = RequiredTables.Where(t => !foundTables.Contains(t)).ToList();

            const string columnSql = "SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users');";
            var foundColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            await using (var colCmd = new SqlCommand(columnSql, conn))
            await using (var colReader = await colCmd.ExecuteReaderAsync())
            {
                while (await colReader.ReadAsync())
                {
                    foundColumns.Add(colReader.GetString(0));
                }
            }

            var missingColumns = RequiredUserColumns.Where(c => !foundColumns.Contains(c)).ToList();
            var missingColumnsMap = new Dictionary<string, IReadOnlyList<string>>();
            if (missingColumns.Count > 0)
            {
                missingColumnsMap["users"] = missingColumns;
            }

            if (missingTables.Count > 0 || missingColumnsMap.Count > 0)
            {
                var tableMsg = missingTables.Count > 0 ? $"Missing tables: {string.Join(", ", missingTables)}." : string.Empty;
                var colMsg = missingColumnsMap.Count > 0
                    ? $" Missing columns: {string.Join(", ", missingColumnsMap.Select(kvp => $"{kvp.Key}({string.Join(", ", kvp.Value)})"))}."
                    : string.Empty;
                return (false, $"{tableMsg}{colMsg}".Trim(),
                    new SchemaReport(missingTables, missingColumnsMap));
            }

            return (true, "Schema ok.",
                new SchemaReport(Array.Empty<string>(), new Dictionary<string, IReadOnlyList<string>>()));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Schema validation failed.");
            return (false, $"Schema validation failed: {ex.Message}",
                new SchemaReport(Array.Empty<string>(), new Dictionary<string, IReadOnlyList<string>>()));
        }
    }
}
