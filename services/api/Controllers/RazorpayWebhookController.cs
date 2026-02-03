using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/billing/razorpay")]
public sealed class RazorpayWebhookController : ControllerBase
{
    private readonly BillingStore _store;
    private readonly EmailService _email;
    private readonly IConfiguration _configuration;

    public RazorpayWebhookController(BillingStore store, EmailService email, IConfiguration configuration)
    {
        _store = store;
        _email = email;
        _configuration = configuration;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook([FromBody] JsonElement payload)
    {
        var secret = _configuration["RAZORPAY_WEBHOOK_SECRET"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            return Unauthorized();
        }

        if (!Request.Headers.TryGetValue("X-Razorpay-Signature", out var sig))
        {
            return Unauthorized();
        }

        var rawBody = payload.GetRawText();
        if (!VerifySignature(rawBody, secret, sig!))
        {
            return Unauthorized();
        }

        var eventType = payload.GetProperty("event").GetString() ?? string.Empty;
        if (eventType != "payment.captured")
        {
            return Ok(new { status = "ignored" });
        }

        var payment = payload.GetProperty("payload").GetProperty("payment").GetProperty("entity");
        var email = payment.GetProperty("email").GetString() ?? string.Empty;
        var tier = payment.GetProperty("notes").GetProperty("tier").GetString() ?? "pro";
        var orgId = payment.GetProperty("notes").TryGetProperty("org_id", out var orgProp) ? orgProp.GetString() : null;

        var activationKey = await _store.CreateActivationKeyAsync(tier, null, orgId, graceDays: 7);
        var invoiceId = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}".ToUpperInvariant();
        var emailSent = await _email.SendActivationEmailAsync(email, activationKey, tier, invoiceId);

        return Ok(new { status = "ok", activationKeyGenerated = true, emailSent });
    }

    private static bool VerifySignature(string payload, string secret, string signature)
    {
        var secretBytes = Encoding.UTF8.GetBytes(secret);
        using var hmac = new HMACSHA256(secretBytes);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computed = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        return computed == signature;
    }
}
