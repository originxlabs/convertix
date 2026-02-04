using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/billing")]
public sealed class BillingController : ControllerBase
{
    private readonly BillingStore _store;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public BillingController(BillingStore store, IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _store = store;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
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

    [HttpGet("credits/balance")]
    public async Task<IActionResult> GetCredits([FromQuery] string userId)
    {
        if (string.IsNullOrWhiteSpace(userId)) return BadRequest("Missing userId.");
        var balance = await _store.GetCreditBalanceAsync(userId);
        return Ok(new { balance });
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsage([FromQuery] string userId, [FromQuery] string? monthKey)
    {
        if (string.IsNullOrWhiteSpace(userId)) return BadRequest("Missing userId.");
        var month = string.IsNullOrWhiteSpace(monthKey) ? DateTime.UtcNow.ToString("yyyy-MM") : monthKey;
        var usage = await _store.GetUsageSummaryAsync(userId, month);
        return Ok(new { month, buckets = usage });
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

    public sealed class CheckoutRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string Tier { get; set; } = "pro";
        public string BillingCycle { get; set; } = "monthly";
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? OrgId { get; set; }
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return BadRequest("Missing userId.");
        }

        var trialEnds = new DateTime(2026, 5, 4, 0, 0, 0, DateTimeKind.Utc);
        if (DateTime.UtcNow <= trialEnds)
        {
            await _store.UpsertUserEntitlementAsync(request.UserId, "enterprise", trialEnds, request.OrgId);
            return Ok(new { status = "trial", tier = "enterprise", expiresAt = trialEnds });
        }

        var keyId = _configuration["RAZORPAY_KEY_ID"];
        var keySecret = _configuration["RAZORPAY_KEY_SECRET"];
        if (string.IsNullOrWhiteSpace(keyId) || string.IsNullOrWhiteSpace(keySecret))
        {
            return BadRequest("Razorpay keys are not configured.");
        }

        var planId = ResolvePlanId(request.Tier, request.BillingCycle);
        if (string.IsNullOrWhiteSpace(planId))
        {
            return BadRequest("Plan is not configured.");
        }

        var payload = new
        {
            plan_id = planId,
            total_count = request.BillingCycle == "yearly" ? 1 : 12,
            customer_notify = 1,
            quantity = 1,
            notes = new
            {
                tier = request.Tier,
                billing_cycle = request.BillingCycle,
                user_id = request.UserId,
                org_id = request.OrgId ?? string.Empty,
                email = request.Email ?? string.Empty,
                name = request.Name ?? string.Empty
            }
        };

        var client = _httpClientFactory.CreateClient();
        var authToken = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{keyId}:{keySecret}"));
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authToken);
        var response = await client.PostAsJsonAsync("https://api.razorpay.com/v1/subscriptions", payload);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, body);
        }
        return Ok(JsonDocument.Parse(body).RootElement);
    }

    private string? ResolvePlanId(string tier, string cycle)
    {
        if (tier == "pro" && cycle == "monthly")
        {
            return _configuration["RAZORPAY_PLAN_PRO_MONTHLY_ID"];
        }
        if (tier == "pro" && cycle == "yearly")
        {
            return _configuration["RAZORPAY_PLAN_PRO_YEARLY_ID"];
        }
        if (tier == "enterprise" && cycle == "monthly")
        {
            return _configuration["RAZORPAY_PLAN_ENTERPRISE_MONTHLY_ID"];
        }
        return null;
    }
}
