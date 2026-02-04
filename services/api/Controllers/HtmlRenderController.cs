using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/pdf")]
public class HtmlRenderController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public HtmlRenderController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    private string ImageEngineBase => Environment.GetEnvironmentVariable("IMAGE_ENGINE_URL") ?? "http://localhost:7071";

    public sealed class HtmlToPdfRequest
    {
        public string? Url { get; set; }
    }

    [HttpPost("html-to-pdf")]
    public async Task<IActionResult> HtmlToPdf([FromBody] HtmlToPdfRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return BadRequest("Missing url.");
        }

        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsJsonAsync($"{ImageEngineBase}/image/html-to-pdf", request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return Problem(error);
        }

        var bytes = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/pdf";
        return File(bytes, contentType, "html.pdf");
    }
}
