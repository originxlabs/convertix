using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api")]
public class PdfEditController : ControllerBase
{
    public sealed class UploadRequest
    {
        public IFormFile? File { get; set; }
    }

    public sealed class ExportRequest
    {
        public string? FileId { get; set; }
        public string? Edits { get; set; }
        public string? PageWidth { get; set; }
        public string? PageHeight { get; set; }
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromForm] UploadRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing file.");
        }

        var tempDir = Path.Combine(Path.GetTempPath(), "pdf-editor");
        Directory.CreateDirectory(tempDir);

        var fileId = Guid.NewGuid().ToString("N");
        var filePath = Path.Combine(tempDir, $"{fileId}.pdf");

        await using var stream = System.IO.File.OpenWrite(filePath);
        await request.File.CopyToAsync(stream);

        return Ok(new { fileId });
    }

    [HttpPost("export")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Export([FromForm] ExportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FileId))
        {
            return BadRequest("Missing fileId.");
        }

        if (!double.TryParse(request.PageWidth, NumberStyles.Float, CultureInfo.InvariantCulture, out var pageWidthValue) ||
            !double.TryParse(request.PageHeight, NumberStyles.Float, CultureInfo.InvariantCulture, out var pageHeightValue))
        {
            return BadRequest("Missing page size.");
        }

        var tempDir = Path.Combine(Path.GetTempPath(), "pdf-editor");
        var inputPath = Path.Combine(tempDir, $"{request.FileId}.pdf");

        if (!System.IO.File.Exists(inputPath))
        {
            return NotFound("PDF not found.");
        }

        var workDir = Path.Combine(tempDir, $"work-{Guid.NewGuid():N}");
        Directory.CreateDirectory(workDir);

        var outputPath = Path.Combine(workDir, "output.pdf");
        var currentPath = Path.Combine(workDir, "current.pdf");
        System.IO.File.Copy(inputPath, currentPath, overwrite: true);

        if (!string.IsNullOrWhiteSpace(request.Edits))
        {
            var editsJson = JsonDocument.Parse(request.Edits).RootElement;
            foreach (var edit in editsJson.EnumerateArray())
            {
                if (!edit.TryGetProperty("type", out var typeProp))
                {
                    return BadRequest("Edit missing type.");
                }

                var type = typeProp.GetString();
                switch (type)
                {
                    case "text":
                        {
                            var text = edit.GetProperty("text").GetString() ?? string.Empty;
                            var page = edit.GetProperty("page").GetInt32();
                            var x = edit.GetProperty("x").GetDouble();
                            var y = edit.GetProperty("y").GetDouble();
                            var height = edit.GetProperty("height").GetDouble();
                            var fontSize = edit.GetProperty("fontSize").GetInt32();
                            var color = edit.GetProperty("color").GetString() ?? "#000000";

                            var pdfY = pageHeightValue - y - height;
                            var desc =
                                $"pos:bl, off:{PdfCpuRunner.Fmt(x)} {PdfCpuRunner.Fmt(pdfY)}, scale:1 abs, rot:0, points:{fontSize}, fillc:{color}";

                            var args = new[]
                            {
                                "stamp", "add",
                                "-pages", page.ToString(CultureInfo.InvariantCulture),
                                "-mode", "text",
                                "--",
                                text,
                                desc,
                                currentPath,
                                outputPath
                            };

                            var result = PdfCpuRunner.Run(args, workDir, out var error);
                            if (!result)
                            {
                                return Problem($"pdfcpu failed: {error}");
                            }

                            System.IO.File.Copy(outputPath, currentPath, overwrite: true);
                            break;
                        }
                    case "image":
                    case "signature":
                        {
                            var page = edit.GetProperty("page").GetInt32();
                            var x = edit.GetProperty("x").GetDouble();
                            var y = edit.GetProperty("y").GetDouble();
                            var height = edit.GetProperty("height").GetDouble();
                            var width = edit.GetProperty("width").GetDouble();
                            var dataUrl = edit.TryGetProperty("src", out var srcProp)
                                ? srcProp.GetString()
                                : edit.GetProperty("data").GetString();

                            if (string.IsNullOrWhiteSpace(dataUrl))
                            {
                                return BadRequest("Image overlay missing data.");
                            }

                            var imagePath = Path.Combine(workDir, $"{Guid.NewGuid():N}.png");
                            var base64Data = dataUrl.Contains(',')
                                ? dataUrl.Split(',')[1]
                                : dataUrl;
                            await System.IO.File.WriteAllBytesAsync(imagePath, Convert.FromBase64String(base64Data));

                            var pdfY = pageHeightValue - y - height;
                            var scale = width / pageWidthValue;
                            var desc =
                                $"pos:bl, off:{PdfCpuRunner.Fmt(x)} {PdfCpuRunner.Fmt(pdfY)}, scale:{PdfCpuRunner.Fmt(scale)} rel, rot:0";

                            var args = new[]
                            {
                                "stamp", "add",
                                "-pages", page.ToString(CultureInfo.InvariantCulture),
                                "-mode", "image",
                                "--",
                                imagePath,
                                desc,
                                currentPath,
                                outputPath
                            };

                            var result = PdfCpuRunner.Run(args, workDir, out var error);
                            if (!result)
                            {
                                return Problem($"pdfcpu failed: {error}");
                            }

                            System.IO.File.Copy(outputPath, currentPath, overwrite: true);
                            break;
                        }
                    default:
                        return BadRequest($"Unsupported edit type: {type}");
                }
            }
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(currentPath);
        return File(fileBytes, "application/pdf", "edited.pdf");
    }
}
