using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("license")]
public sealed class LicenseController : ControllerBase
{
    private readonly BillingStore _store;

    public LicenseController(BillingStore store)
    {
        _store = store;
    }

    public sealed class ActivateRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string ActivationKey { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
    }

    public sealed class ActivateResponse
    {
        public string UserId { get; set; } = string.Empty;
        public string Tier { get; set; } = string.Empty;
        public long? ExpiresAtMs { get; set; }
        public string? OrgId { get; set; }
        public int GracePeriodDays { get; set; }
        public string? InvoiceId { get; set; }
        public bool InvoiceEmailSent { get; set; }
    }

    [HttpPost("activate")]
    public async Task<IActionResult> Activate([FromBody] ActivateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId)
            || string.IsNullOrWhiteSpace(request.ActivationKey)
            || string.IsNullOrWhiteSpace(request.DeviceId))
        {
            return BadRequest("Missing activation fields.");
        }

        var record = await _store.GetActivationByKeyAsync(request.ActivationKey);
        if (record is null)
        {
            return Unauthorized();
        }

        await _store.MarkActivationUsedAsync(record.ActivationHash, request.UserId, request.DeviceId);

        return Ok(new ActivateResponse
        {
            UserId = request.UserId,
            Tier = record.Tier,
            ExpiresAtMs = record.ExpiresAt?.ToUniversalTime().Ticks / TimeSpan.TicksPerMillisecond,
            OrgId = record.OrgId,
            GracePeriodDays = record.GracePeriodDays,
            InvoiceId = null,
            InvoiceEmailSent = false
        });
    }
}
