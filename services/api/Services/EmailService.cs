using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace PdfEditor.Api.Services;

public sealed class EmailService
{
    private readonly HttpClient _client;
    private readonly string _apiKey;
    private readonly string _from;

    public EmailService(HttpClient client, IConfiguration configuration)
    {
        _client = client;
        _apiKey = configuration["RESEND_API_KEY"] ?? string.Empty;
        _from = configuration["RESEND_FROM"] ?? "CONVERTIX <billing@convertix.app>";
    }

    public async Task<bool> SendActivationEmailAsync(string to, string activationKey, string tier, string? invoiceId)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            return false;
        }

        var payload = new
        {
            from = _from,
            to = new[] { to },
            subject = $"Your CONVERTIX {tier} activation key",
            html = $@"
<h2>CONVERTIX Activation</h2>
<p>Tier: <strong>{tier}</strong></p>
<p>Activation Key: <strong>{activationKey}</strong></p>
<p>Invoice: {invoiceId ?? "N/A"}</p>
<p>Thank you for choosing CONVERTIX.</p>"
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _client.SendAsync(request);
        return response.IsSuccessStatusCode;
    }
}
