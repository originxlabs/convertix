using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/image")]
public class ImageLabsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly BillingStore _billingStore;

    public ImageLabsController(IHttpClientFactory httpClientFactory, IConfiguration configuration, BillingStore billingStore)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _billingStore = billingStore;
    }

    private string ImageEngineBase => Environment.GetEnvironmentVariable("IMAGE_ENGINE_URL") ?? "http://localhost:5055/image-engine";
    private string Tier => (_configuration["TIER"] ?? "free").ToLowerInvariant();

    private bool IsProTier => Tier is "pro" or "enterprise";

    private string? RemoveBgKey => _configuration["ImageAI:RemoveBg:ApiKey"] ?? _configuration["IMAGEAI_REMOVE_BG_KEY"];
    private string? DeepAiKey => _configuration["ImageAI:DeepAI:ApiKey"] ?? _configuration["IMAGEAI_DEEPAI_KEY"];
    private string? GoogleVisionKey => _configuration["ImageAI:GoogleVision:ApiKey"] ?? _configuration["IMAGEAI_GOOGLE_VISION_KEY"];
    private string? ImgflipUser => _configuration["ImageAI:Imgflip:Username"] ?? _configuration["IMAGEAI_IMGFLIP_USER"];
    private string? ImgflipPassword => _configuration["ImageAI:Imgflip:Password"] ?? _configuration["IMAGEAI_IMGFLIP_PASSWORD"];

    public sealed class ImageProcessRequest
    {
        public IFormFile? File { get; set; }
        public string? Operation { get; set; }
    }

    public sealed class ImageMemeRequest
    {
        public IFormFile? File { get; set; }
        public string? TemplateId { get; set; }
        public string? TopText { get; set; }
        public string? BottomText { get; set; }
    }

    public sealed class ImageFileRequest
    {
        public IFormFile? File { get; set; }
    }

    [HttpPost("process")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Process([FromForm] ImageProcessRequest request)
    {
        if (request.File is null) return BadRequest("Missing file.");
        if (string.IsNullOrWhiteSpace(request.Operation)) return BadRequest("Missing operation.");

        var client = _httpClientFactory.CreateClient();
        using var form = new MultipartFormDataContent();
        await using var stream = request.File.OpenReadStream();
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        var fileBytes = ms.ToArray();
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(request.File.ContentType);
        form.Add(fileContent, "file", request.File.FileName);

        foreach (var key in Request.Form.Keys)
        {
            if (key is "file" or "operation") continue;
            var value = Request.Form[key].ToString();
            if (!string.IsNullOrWhiteSpace(value))
            {
                form.Add(new StringContent(value), key);
            }
        }

        form.Add(new StringContent(request.Operation), "operation");
        var response = await client.PostAsync($"{ImageEngineBase}/image/process", form);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return Problem(error);
        }

        var bytes = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";
        await TrackUsageAsync($"image:{request.Operation}");
        return File(bytes, contentType);
    }

    [HttpPost("remove-bg")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RemoveBackground([FromForm] ImageFileRequest request)
        => await ForwardAiRequest("remove-bg", request.File, new Dictionary<string, string?>());

    [HttpPost("upscale")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upscale([FromForm] ImageFileRequest request)
        => await ForwardAiRequest("upscale", request.File, new Dictionary<string, string?>());

    [HttpPost("blur-face")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> BlurFace([FromForm] ImageFileRequest request)
        => await ForwardAiRequest("blur-face", request.File, new Dictionary<string, string?>());

    [HttpPost("meme")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Meme([FromForm] ImageMemeRequest request)
        => await ForwardAiRequest(
            "meme",
            request.File,
            new Dictionary<string, string?>
            {
                ["templateId"] = request.TemplateId,
                ["topText"] = request.TopText,
                ["bottomText"] = request.BottomText
            }
        );

    [HttpPost("html-to-image")]
    public async Task<IActionResult> HtmlToImage([FromBody] HtmlToImageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url)) return BadRequest("Missing url.");
        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsJsonAsync($"{ImageEngineBase}/image/html-to-image", request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return Problem(error);
        }
        var bytes = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/png";
        await TrackUsageAsync("image:html-to-image");
        return File(bytes, contentType);
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health()
    {
        var client = _httpClientFactory.CreateClient();
        try
        {
            var response = await client.GetAsync($"{ImageEngineBase}/health");
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, "Image engine unavailable.");
            }

            var json = await response.Content.ReadAsStringAsync();
            return Content(json, "application/json");
        }
        catch
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Image engine unavailable.");
        }
    }

    [HttpGet("health/tools")]
    public async Task<IActionResult> ToolsHealth()
    {
        var engineOk = false;
        var playwrightOk = false;
        try
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{ImageEngineBase}/health");
            engineOk = response.IsSuccessStatusCode;
            var toolsResponse = await client.GetAsync($"{ImageEngineBase}/health/tools");
            if (toolsResponse.IsSuccessStatusCode)
            {
                var json = await toolsResponse.Content.ReadFromJsonAsync<Dictionary<string, bool>>();
                playwrightOk = json != null && json.TryGetValue("playwright", out var ok) && ok;
            }
        }
        catch
        {
            engineOk = false;
            playwrightOk = false;
        }

        var removeBg = IsProTier && !string.IsNullOrWhiteSpace(RemoveBgKey);
        var upscale = IsProTier && !string.IsNullOrWhiteSpace(DeepAiKey);
        var blurFace = IsProTier && !string.IsNullOrWhiteSpace(GoogleVisionKey);
        var meme = IsProTier && !string.IsNullOrWhiteSpace(ImgflipUser) && !string.IsNullOrWhiteSpace(ImgflipPassword);

        return Ok(new
        {
            engine = engineOk,
            playwright = playwrightOk,
            removebg = removeBg,
            upscale,
            blurface = blurFace,
            meme
        });
    }

    public sealed class HtmlToImageRequest
    {
        public string? Url { get; set; }
        public string? Format { get; set; }
    }

    private async Task<IActionResult> ForwardAiRequest(string operation, IFormFile? file, IDictionary<string, string?> fields)
    {
        if (!IsProTier)
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Pro tier required.");
        }

        if (file is null) return BadRequest("Missing file.");

        var client = _httpClientFactory.CreateClient();
        using var form = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        var fileBytes = ms.ToArray();
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
        form.Add(fileContent, "file", file.FileName);

        foreach (var pair in fields)
        {
            if (!string.IsNullOrWhiteSpace(pair.Value))
            {
                form.Add(new StringContent(pair.Value), pair.Key);
            }
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{ImageEngineBase}/image/ai/{operation}")
        {
            Content = form
        };

        if (operation == "remove-bg" && !string.IsNullOrWhiteSpace(RemoveBgKey))
        {
            request.Headers.Add("x-removebg-key", RemoveBgKey);
        }
        if (operation == "upscale" && !string.IsNullOrWhiteSpace(DeepAiKey))
        {
            request.Headers.Add("x-deepai-key", DeepAiKey);
        }
        if (operation == "blur-face" && !string.IsNullOrWhiteSpace(GoogleVisionKey))
        {
            request.Headers.Add("x-google-vision-key", GoogleVisionKey);
        }
        if (operation == "meme")
        {
            if (!string.IsNullOrWhiteSpace(ImgflipUser))
            {
                request.Headers.Add("x-imgflip-user", ImgflipUser);
            }
            if (!string.IsNullOrWhiteSpace(ImgflipPassword))
            {
                request.Headers.Add("x-imgflip-password", ImgflipPassword);
            }
        }

        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return Problem(error);
        }

        var bytes = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";
        await TrackUsageAsync($"image:{operation}");
        return File(bytes, contentType);
    }

    private async Task TrackUsageAsync(string feature)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(userId))
        {
            return;
        }

        var monthKey = DateTime.UtcNow.ToString("yyyy-MM");
        await _billingStore.InsertUsageAsync(userId, feature, 1, monthKey);
    }
}
