using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public HealthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", timestamp = DateTimeOffset.UtcNow });

    [HttpGet("db")]
    public async Task<IActionResult> Db()
    {
        var connectionString = _configuration["AZURE_SQL_CONNECTION"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "AZURE_SQL_CONNECTION missing.");
        }

        try
        {
            await using var conn = new SqlConnection(connectionString);
            await conn.OpenAsync();
            await using var cmd = new SqlCommand("SELECT 1", conn);
            await cmd.ExecuteScalarAsync();
            return Ok(new { status = "ok" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, $"DB unavailable: {ex.Message}");
        }
    }
}
