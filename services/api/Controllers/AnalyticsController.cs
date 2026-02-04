using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly AnalyticsStore _store;

    public AnalyticsController(AnalyticsStore store)
    {
        _store = store;
    }

    public sealed class VisitRequest
    {
        public string? Path { get; set; }
    }

    [HttpPost("visit")]
    public async Task<IActionResult> Visit([FromBody] VisitRequest request)
    {
        var total = await _store.IncrementCounterAsync("total");
        if (!string.IsNullOrWhiteSpace(request.Path))
        {
            var pathKey = $"path:{request.Path.Trim().ToLowerInvariant()}";
            await _store.IncrementCounterAsync(pathKey);
        }

        return Ok(new { total });
    }

    [HttpGet("visits/total")]
    public async Task<IActionResult> GetTotalVisits()
    {
        var total = await _store.GetCounterAsync("total");
        return Ok(new { total });
    }
}
