using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/billing")]
public sealed class BillingController : ControllerBase
{
    private readonly BillingStore _store;

    public BillingController(BillingStore store)
    {
        _store = store;
    }

    [HttpGet("tiers")]
    public async Task<IActionResult> GetTiers()
    {
        var tiers = await _store.GetTiersAsync();
        return Ok(tiers);
    }

    [HttpGet("pricing")]
    public async Task<IActionResult> GetPricing([FromQuery] string? userId)
    {
        var pricing = await _store.GetPricingAsync(userId);
        return Ok(pricing);
    }

    [HttpGet("entitlement")]
    public async Task<IActionResult> GetEntitlement([FromQuery] string userId)
    {
        var ent = await _store.GetUserEntitlementAsync(userId);
        if (ent is null) return NotFound();
        return Ok(ent);
    }

    public sealed class UsageRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string Feature { get; set; } = string.Empty;
        public int Amount { get; set; } = 1;
        public string MonthKey { get; set; } = string.Empty;
    }

    [HttpPost("usage")]
    public async Task<IActionResult> TrackUsage([FromBody] UsageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) || string.IsNullOrWhiteSpace(request.Feature))
        {
            return BadRequest("Missing usage fields.");
        }
        await _store.InsertUsageAsync(request.UserId, request.Feature, request.Amount, request.MonthKey);
        return Ok(new { status = "ok" });
    }

    public sealed class CreditRequest
    {
        public string UserId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Reason { get; set; } = "usage";
    }

    [HttpPost("credits/add")]
    public async Task<IActionResult> AddCredits([FromBody] CreditRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) || request.Amount <= 0)
        {
            return BadRequest("Invalid credit request.");
        }
        var balance = await _store.AddCreditsAsync(request.UserId, request.Amount, request.Reason);
        return Ok(new { balance });
    }

    [HttpPost("credits/consume")]
    public async Task<IActionResult> ConsumeCredits([FromBody] CreditRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) || request.Amount <= 0)
        {
            return BadRequest("Invalid credit request.");
        }
        var balance = await _store.ConsumeCreditsAsync(request.UserId, request.Amount, request.Reason);
        return Ok(new { balance });
    }
}
