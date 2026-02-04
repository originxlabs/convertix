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
        if (eventType != "payment.captured" && eventType != "invoice.paid" && eventType != "subscription.activated")
        {
            return Ok(new { status = "ignored" });
        }

        var payment = payload.GetProperty("payload").GetProperty("payment").GetProperty("entity");
        var email = payment.TryGetProperty("email", out var emailProp) ? emailProp.GetString() ?? string.Empty : string.Empty;
        var notes = payment.TryGetProperty("notes", out var notesProp) ? notesProp : default;
        var tier = notes.ValueKind != JsonValueKind.Undefined && notes.TryGetProperty("tier", out var tierProp)
            ? tierProp.GetString() ?? "pro"
            : "pro";
        var userId = notes.ValueKind != JsonValueKind.Undefined && notes.TryGetProperty("user_id", out var userProp)
            ? userProp.GetString()
            : null;
        var orgId = notes.ValueKind != JsonValueKind.Undefined && notes.TryGetProperty("org_id", out var orgProp)
            ? orgProp.GetString()
            : null;
        var cycle = notes.ValueKind != JsonValueKind.Undefined && notes.TryGetProperty("billing_cycle", out var cycleProp)
            ? cycleProp.GetString()
            : "monthly";

        DateTime? expiresAt = cycle == "yearly" ? DateTime.UtcNow.AddYears(1) : DateTime.UtcNow.AddMonths(1);
        if (!string.IsNullOrWhiteSpace(userId))
        {
            await _store.UpsertUserEntitlementAsync(userId, tier, expiresAt, orgId);
        }

        var activationKey = await _store.CreateActivationKeyAsync(tier, expiresAt, orgId, graceDays: 7);
        var invoiceId = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}".ToUpperInvariant();
        var emailSent = string.IsNullOrWhiteSpace(email)
            ? false
            : await _email.SendActivationEmailAsync(email, activationKey, tier, invoiceId);

        return Ok(new { status = "ok", activationKeyGenerated = true, emailSent, entitlementUpdated = !string.IsNullOrWhiteSpace(userId) });
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
