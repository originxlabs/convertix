using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("image-engine/{**path}")]
public class ImageEngineProxyController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public ImageEngineProxyController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    private string ImageEngineBase => Environment.GetEnvironmentVariable("IMAGE_ENGINE_URL") ?? "http://localhost:7071";

    [HttpGet, HttpPost, HttpPut, HttpPatch, HttpDelete, HttpOptions]
    public async Task<IActionResult> Proxy(string? path)
    {
        var targetUrl = $"{ImageEngineBase}/{path ?? string.Empty}{Request.QueryString}";
        var client = _httpClientFactory.CreateClient();

        using var requestMessage = new HttpRequestMessage(new HttpMethod(Request.Method), targetUrl);

        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(HttpContext.RequestAborted);
            var formContent = new MultipartFormDataContent();

            foreach (var field in form)
            {
                formContent.Add(new StringContent(field.Value.ToString()), field.Key);
            }

            foreach (var file in form.Files)
            {
                await using var fileStream = file.OpenReadStream();
                using var ms = new MemoryStream();
                await fileStream.CopyToAsync(ms, HttpContext.RequestAborted);
                var fileContent = new ByteArrayContent(ms.ToArray());
                if (!string.IsNullOrWhiteSpace(file.ContentType))
                {
                    fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(file.ContentType);
                }
                formContent.Add(fileContent, file.Name, file.FileName);
            }

            requestMessage.Content = formContent;
        }
        else
        {
            var bodyStream = Request.Body;
            var hasBody = bodyStream != null
                && (Request.ContentLength is > 0 || Request.Headers.ContainsKey("Transfer-Encoding"));

            if (hasBody)
            {
                Request.EnableBuffering();
                using var ms = new MemoryStream();
                await bodyStream!.CopyToAsync(ms, HttpContext.RequestAborted);

                var content = new ByteArrayContent(ms.ToArray());
                requestMessage.Content = content;
                if (!string.IsNullOrWhiteSpace(Request.ContentType))
                {
                    requestMessage.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(Request.ContentType);
                }
            }
        }

        foreach (var header in Request.Headers)
        {
            if (string.Equals(header.Key, "Host", StringComparison.OrdinalIgnoreCase)
                || string.Equals(header.Key, "Content-Length", StringComparison.OrdinalIgnoreCase)
                || string.Equals(header.Key, "Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()) && requestMessage.Content != null)
            {
                requestMessage.Content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
            }
        }

        using var response = await client.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead, HttpContext.RequestAborted);

        foreach (var header in response.Headers)
        {
            Response.Headers[header.Key] = header.Value.ToArray();
        }

        foreach (var header in response.Content.Headers)
        {
            Response.Headers[header.Key] = header.Value.ToArray();
        }

        Response.Headers.Remove("transfer-encoding");
        var contentType = response.Content.Headers.ContentType?.ToString();
        var bytes = await response.Content.ReadAsByteArrayAsync();
        return File(bytes, contentType ?? "application/octet-stream", enableRangeProcessing: false);
    }
}
