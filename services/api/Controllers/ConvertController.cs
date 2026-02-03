using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/convert")]
public class ConvertController : ControllerBase
{
    public sealed class ImageToPdfRequest
    {
        public List<IFormFile>? Files { get; set; }
    }

    [HttpPost("image-to-pdf")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImageToPdf([FromForm] ImageToPdfRequest request)
    {
        if (request.Files is null || request.Files.Count == 0)
        {
            return BadRequest("Missing image files.");
        }

        var tempDir = Path.Combine(Path.GetTempPath(), "pdf-editor");
        Directory.CreateDirectory(tempDir);

        var workDir = Path.Combine(tempDir, $"work-{Guid.NewGuid():N}");
        Directory.CreateDirectory(workDir);

        var imagePaths = new List<string>();
        foreach (var file in request.Files)
        {
            var extension = Path.GetExtension(file.FileName);
            var imagePath = Path.Combine(workDir, $"{Guid.NewGuid():N}{extension}");
            await using var stream = System.IO.File.OpenWrite(imagePath);
            await file.CopyToAsync(stream);
            imagePaths.Add(imagePath);
        }

        var outputPath = Path.Combine(workDir, "converted.pdf");
        var args = new List<string> { "import", "--", outputPath };
        args.AddRange(imagePaths);

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(fileBytes, "application/pdf", "converted.pdf");
    }
}
