using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Diagnostics;
using System.Net.Http.Json;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public HealthController(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
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

    [HttpGet("tools")]
    public async Task<IActionResult> Tools()
    {
        var libreOffice = CheckBinary("soffice") || CheckBinary("libreoffice");
        var pdftotext = CheckBinary("pdftotext");
        var pandoc = CheckBinary("pandoc");
        var pdfcpu = CheckBinary("pdfcpu") || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("PDFCPU_PATH"));
        var ocrmypdf = CheckBinary("ocrmypdf");

        var playwright = false;
        var imageEngineBase = _configuration["IMAGE_ENGINE_BASE_URL"]
            ?? Environment.GetEnvironmentVariable("IMAGE_ENGINE_URL")
            ?? "http://localhost:7071";
        try
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{imageEngineBase}/health/tools");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadFromJsonAsync<Dictionary<string, bool>>();
                playwright = json != null && json.TryGetValue("playwright", out var ok) && ok;
            }
        }
        catch
        {
            playwright = false;
        }

        return Ok(new
        {
            libreoffice = libreOffice,
            pdftotext,
            pandoc,
            pdfcpu,
            playwright,
            ocrmypdf,
            imageEngineBaseUrl = imageEngineBase
        });
    }

    [HttpGet("schema")]
    public async Task<IActionResult> Schema([FromServices] PdfEditor.Api.Services.SchemaValidator validator)
    {
        var (ok, message, report) = await validator.ValidateAsync();
        if (!ok)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "error",
                message,
                missingTables = report.MissingTables,
                missingColumns = report.MissingColumns
            });
        }

        return Ok(new
        {
            status = "ok",
            message,
            missingTables = report.MissingTables,
            missingColumns = report.MissingColumns
        });
    }

    private static bool CheckBinary(string name)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = name,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            startInfo.ArgumentList.Add("--version");
            using var process = Process.Start(startInfo);
            if (process is null) return false;
            process.WaitForExit(3000);
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }
}
