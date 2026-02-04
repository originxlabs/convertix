using System.Diagnostics;
using System.Globalization;
using System.IO.Compression;
using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/pdf")]
public class PdfToolsController : ControllerBase
{
    public sealed class MergeRequest
    {
        public List<IFormFile>? Files { get; set; }
    }

    public sealed class SplitRequest
    {
        public IFormFile? File { get; set; }
        public string? Mode { get; set; }
        public string? Span { get; set; }
        public string? Pages { get; set; }
    }

    public sealed class CompressRequest
    {
        public IFormFile? File { get; set; }
    }

    public sealed class ProtectRequest
    {
        public IFormFile? File { get; set; }
        public string? OwnerPassword { get; set; }
        public string? UserPassword { get; set; }
    }

    public sealed class UnlockRequest
    {
        public IFormFile? File { get; set; }
        public string? OwnerPassword { get; set; }
        public string? UserPassword { get; set; }
    }

    public sealed class OrganizeRequest
    {
        public IFormFile? File { get; set; }
        public string? Pages { get; set; }
    }

    public sealed class PageSelectionRequest
    {
        public IFormFile? File { get; set; }
        public string? Pages { get; set; }
        public string? Mode { get; set; }
    }

    public sealed class RotateRequest
    {
        public IFormFile? File { get; set; }
        public string? Pages { get; set; }
        public string? Angle { get; set; }
    }

    public sealed class WatermarkRequest
    {
        public IFormFile? File { get; set; }
        public string? Text { get; set; }
        public string? Pages { get; set; }
        public string? Position { get; set; }
        public string? Opacity { get; set; }
        public string? Scale { get; set; }
    }

    public sealed class CropRequest
    {
        public IFormFile? File { get; set; }
        public string? CropBox { get; set; }
        public string? Pages { get; set; }
    }

    public sealed class SignRequest
    {
        public IFormFile? File { get; set; }
        public IFormFile? Signature { get; set; }
        public string? Position { get; set; }
        public string? Scale { get; set; }
    }

    public sealed class CompareRequest
    {
        public List<IFormFile>? Files { get; set; }
    }

    public sealed class SimplePdfRequest
    {
        public IFormFile? File { get; set; }
    }

    public sealed class ScanToPdfRequest
    {
        public List<IFormFile>? Files { get; set; }
    }

    public sealed class RedactRequest
    {
        public IFormFile? File { get; set; }
        public string? Text { get; set; }
        public string? Pages { get; set; }
    }


    [HttpPost("merge")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Merge([FromForm] MergeRequest request)
    {
        if (request.Files is null || request.Files.Count < 2)
        {
            return BadRequest("Please upload at least two PDFs.");
        }

        var workDir = CreateWorkDir();
        var inputPaths = new List<string>();
        foreach (var file in request.Files)
        {
            var path = await SaveFormFile(file, workDir, ".pdf");
            inputPaths.Add(path);
        }

        var outputPath = Path.Combine(workDir, "merged.pdf");
        var args = new List<string> { "merge", "--", outputPath };
        args.AddRange(inputPaths);

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "merged.pdf");
    }

    [HttpPost("split")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Split([FromForm] SplitRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputDir = Path.Combine(workDir, "split");
        Directory.CreateDirectory(outputDir);

        var mode = string.IsNullOrWhiteSpace(request.Mode) ? "span" : request.Mode;
        var args = new List<string> { "split" };

        if (string.Equals(mode, "page", StringComparison.OrdinalIgnoreCase))
        {
            args.AddRange(new[] { "-m", "page", "--", inputPath, outputDir });
            if (!string.IsNullOrWhiteSpace(request.Pages))
            {
                args.AddRange(request.Pages.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
            }
        }
        else
        {
            var span = string.IsNullOrWhiteSpace(request.Span) ? "1" : request.Span;
            args.AddRange(new[] { "-m", "span", "--", inputPath, outputDir, span });
        }

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var zipPath = Path.Combine(workDir, "split.zip");
        ZipFile.CreateFromDirectory(outputDir, zipPath);
        var bytes = await System.IO.File.ReadAllBytesAsync(zipPath);
        return File(bytes, "application/zip", "split.zip");
    }

    [HttpPost("compress")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Compress([FromForm] CompressRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "compressed.pdf");

        var args = new[] { "optimize", "--", inputPath, outputPath };
        var result = PdfCpuRunner.Run(args, workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "compressed.pdf");
    }

    [HttpPost("protect")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Protect([FromForm] ProtectRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        if (string.IsNullOrWhiteSpace(request.OwnerPassword))
        {
            return BadRequest("Owner password is required.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "protected.pdf");

        var args = new List<string> { "encrypt", "-opw", request.OwnerPassword };
        if (!string.IsNullOrWhiteSpace(request.UserPassword))
        {
            args.AddRange(new[] { "-upw", request.UserPassword });
        }
        args.AddRange(new[] { "--", inputPath, outputPath });

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "protected.pdf");
    }

    [HttpPost("unlock")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Unlock([FromForm] UnlockRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "unlocked.pdf");

        var args = new List<string> { "decrypt" };
        if (!string.IsNullOrWhiteSpace(request.OwnerPassword))
        {
            args.AddRange(new[] { "-opw", request.OwnerPassword });
        }
        if (!string.IsNullOrWhiteSpace(request.UserPassword))
        {
            args.AddRange(new[] { "-upw", request.UserPassword });
        }
        args.AddRange(new[] { "--", inputPath, outputPath });

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "unlocked.pdf");
    }

    [HttpPost("organize")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Organize([FromForm] OrganizeRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        if (string.IsNullOrWhiteSpace(request.Pages))
        {
            return BadRequest("Pages definition is required.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "organized.pdf");

        var args = new[] { "collect", "-p", request.Pages, inputPath, outputPath };
        var result = PdfCpuRunner.Run(args, workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "organized.pdf");
    }

    [HttpPost("remove")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RemovePages([FromForm] PageSelectionRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }
        if (string.IsNullOrWhiteSpace(request.Pages))
        {
            return BadRequest("Pages definition is required.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "removed.pdf");

        var mode = string.IsNullOrWhiteSpace(request.Mode) ? "remove" : request.Mode;
        string[] args;
        if (string.Equals(mode, "remove", StringComparison.OrdinalIgnoreCase))
        {
            args = new[] { "pages", "remove", "-p", request.Pages, inputPath, outputPath };
        }
        else
        {
            var pagesExpr = request.Pages;
            if (!PdfCpuRunner.TryGetPageCount(inputPath, workDir, out var totalPages, out var pageErr))
            {
                return Problem($"pdfcpu failed: {pageErr}");
            }
            var removeSet = ParsePageSelection(request.Pages, totalPages);
            var keepPages = Enumerable.Range(1, totalPages).Where(p => !removeSet.Contains(p)).ToList();
            if (keepPages.Count == 0)
            {
                return BadRequest("Cannot remove all pages.");
            }
            pagesExpr = string.Join(",", keepPages);
            args = new[] { "collect", "-p", pagesExpr, inputPath, outputPath };
        }
        var result = PdfCpuRunner.Run(args, workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "removed.pdf");
    }

    [HttpPost("extract")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ExtractPages([FromForm] PageSelectionRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }
        if (string.IsNullOrWhiteSpace(request.Pages))
        {
            return BadRequest("Pages definition is required.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "extracted.pdf");

        var args = new[] { "collect", "-p", request.Pages, inputPath, outputPath };
        var result = PdfCpuRunner.Run(args, workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "extracted.pdf");
    }

    [HttpPost("repair")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Repair([FromForm] CompressRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "repaired.pdf");

        var args = new[] { "optimize", "--", inputPath, outputPath };
        var result = PdfCpuRunner.Run(args, workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "repaired.pdf");
    }

    [HttpPost("rotate")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Rotate([FromForm] RotateRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var angle = string.IsNullOrWhiteSpace(request.Angle) ? "90" : request.Angle;
        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "rotated.pdf");

        var args = new List<string> { "rotate" };
        if (!string.IsNullOrWhiteSpace(request.Pages))
        {
            args.AddRange(new[] { "-p", request.Pages });
        }
        args.AddRange(new[] { inputPath, angle, outputPath });

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "rotated.pdf");
    }

    [HttpPost("watermark")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Watermark([FromForm] WatermarkRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var text = string.IsNullOrWhiteSpace(request.Text) ? "Convertix" : request.Text;
        var position = string.IsNullOrWhiteSpace(request.Position) ? "br" : request.Position;
        var opacity = string.IsNullOrWhiteSpace(request.Opacity) ? "0.3" : request.Opacity;
        var scale = string.IsNullOrWhiteSpace(request.Scale) ? "0.6" : request.Scale;

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "watermarked.pdf");

        var desc = $"pos:{position}, scale:{scale} rel, rot:0, op:{opacity}";
        var args = new List<string> { "stamp", "add", "-mode", "text" };
        if (!string.IsNullOrWhiteSpace(request.Pages))
        {
            args.AddRange(new[] { "-pages", request.Pages });
        }
        args.AddRange(new[] { "--", text, desc, inputPath, outputPath });

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "watermarked.pdf");
    }

    [HttpPost("page-numbers")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> PageNumbers([FromForm] WatermarkRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var position = string.IsNullOrWhiteSpace(request.Position) ? "bc" : request.Position;
        var opacity = string.IsNullOrWhiteSpace(request.Opacity) ? "0.6" : request.Opacity;
        var scale = string.IsNullOrWhiteSpace(request.Scale) ? "0.35" : request.Scale;
        var label = string.IsNullOrWhiteSpace(request.Text) ? "Page %p" : request.Text;

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "page-numbers.pdf");

        var desc = $"pos:{position}, scale:{scale} rel, rot:0, op:{opacity}";
        var args = new List<string> { "stamp", "add", "-mode", "text" };
        if (!string.IsNullOrWhiteSpace(request.Pages))
        {
            args.AddRange(new[] { "-pages", request.Pages });
        }
        args.AddRange(new[] { "--", label, desc, inputPath, outputPath });

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "page-numbers.pdf");
    }

    [HttpPost("crop")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Crop([FromForm] CropRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        if (string.IsNullOrWhiteSpace(request.CropBox))
        {
            return BadRequest("Crop box is required.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "cropped.pdf");

        var args = new List<string> { "crop" };
        if (!string.IsNullOrWhiteSpace(request.Pages))
        {
            args.AddRange(new[] { "-p", request.Pages });
        }
        args.AddRange(new[] { "--", request.CropBox, inputPath, outputPath });

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "cropped.pdf");
    }

    [HttpPost("sign")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Sign([FromForm] SignRequest request)
    {
        if (request.File is null || request.Signature is null)
        {
            return BadRequest("Missing PDF or signature.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var signaturePath = await SaveFormFile(request.Signature, workDir, Path.GetExtension(request.Signature.FileName));
        var outputPath = Path.Combine(workDir, "signed.pdf");

        var position = string.IsNullOrWhiteSpace(request.Position) ? "br" : request.Position;
        position = position.Trim();
        var normalizedPosition = position.Replace(" ", "", StringComparison.OrdinalIgnoreCase)
            .Replace("-", "", StringComparison.OrdinalIgnoreCase)
            .ToLowerInvariant();
        position = normalizedPosition switch
        {
            "bottomright" => "br",
            "bottomleft" => "bl",
            "topright" => "tr",
            "topleft" => "tl",
            "center" => "c",
            _ => position
        };
        var scale = string.IsNullOrWhiteSpace(request.Scale) ? "0.2" : request.Scale;
        var desc = $"pos:{position}, off:20 20, scale:{scale} rel, rot:0";

        var args = new[]
        {
            "stamp", "add",
            "-p", "1",
            "-mode", "image",
            "--",
            signaturePath,
            desc,
            inputPath,
            outputPath
        };

        var result = PdfCpuRunner.Run(args, workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "signed.pdf");
    }

    [HttpPost("redact")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Redact([FromForm] RedactRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var text = string.IsNullOrWhiteSpace(request.Text) ? "REDACTED" : request.Text;
        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "redacted.pdf");

        var desc = "pos:c, scale:1 abs, rot:45, op:0.75, fillc:#111111";
        var args = new List<string> { "stamp", "add", "-mode", "text" };
        if (!string.IsNullOrWhiteSpace(request.Pages))
        {
            args.AddRange(new[] { "-pages", request.Pages });
        }
        args.AddRange(new[] { "--", text, desc, inputPath, outputPath });

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "redacted.pdf");
    }

    [HttpPost("compare")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Compare([FromForm] CompareRequest request)
    {
        if (request.Files is null || request.Files.Count < 2)
        {
            return BadRequest("Please upload two PDFs to compare.");
        }

        var workDir = CreateWorkDir();
        var inputPaths = new List<string>();
        foreach (var file in request.Files.Take(2))
        {
            var path = await SaveFormFile(file, workDir, ".pdf");
            inputPaths.Add(path);
        }

        var outputPath = Path.Combine(workDir, "comparison.pdf");
        var args = new List<string> { "merge", "--", outputPath };
        args.AddRange(inputPaths);

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "comparison.pdf");
    }

    [HttpPost("flatten")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Flatten([FromForm] SimplePdfRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "flattened.pdf");

        var args = new[] { "optimize", "--", inputPath, outputPath };
        var result = PdfCpuRunner.Run(args, workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "flattened.pdf");
    }

    [HttpPost("pdf-to-pdfa")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> PdfToPdfa([FromForm] SimplePdfRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        if (!CheckBinary("ocrmypdf"))
        {
            return StatusCode(StatusCodes.Status501NotImplemented,
                "ocrmypdf is required for strict PDF/A conversion.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "archive.pdf");

        var args = new[] { "--output-type", "pdfa-2", "--skip-text", inputPath, outputPath };
        var result = RunProcess("ocrmypdf", args, workDir, out var error);
        if (!result)
        {
            return Problem($"ocrmypdf failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "archive.pdf");
    }

    [HttpPost("scan-to-pdf")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ScanToPdf([FromForm] ScanToPdfRequest request)
    {
        if (request.Files is null || request.Files.Count == 0)
        {
            return BadRequest("Missing image files.");
        }

        var workDir = CreateWorkDir();
        var imagePaths = new List<string>();
        foreach (var file in request.Files)
        {
            var extension = Path.GetExtension(file.FileName);
            var imagePath = await SaveFormFile(file, workDir, extension);
            imagePaths.Add(imagePath);
        }

        var outputPath = Path.Combine(workDir, "scanned.pdf");
        var args = new List<string> { "import", "--", outputPath };
        args.AddRange(imagePaths);

        var result = PdfCpuRunner.Run(args.ToArray(), workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "scanned.pdf");
    }

    [HttpPost("ocr")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Ocr([FromForm] SimplePdfRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var outputPath = Path.Combine(workDir, "ocr.pdf");

        if (!CheckBinary("ocrmypdf"))
        {
            return StatusCode(StatusCodes.Status501NotImplemented,
                "ocrmypdf is required for OCR.");
        }

        var args = new[] { "--force-ocr", "--output-type", "pdf", inputPath, outputPath };
        var ok = RunProcess("ocrmypdf", args, workDir, out var error);
        if (!ok)
        {
            return Problem($"ocrmypdf failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "ocr.pdf");
    }


    private static string CreateWorkDir()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "pdf-editor");
        Directory.CreateDirectory(tempDir);
        var workDir = Path.Combine(tempDir, $"work-{Guid.NewGuid():N}");
        Directory.CreateDirectory(workDir);
        return workDir;
    }

    private static async Task<string> SaveFormFile(IFormFile file, string workDir, string? extensionOverride)
    {
        var extension = string.IsNullOrWhiteSpace(extensionOverride)
            ? Path.GetExtension(file.FileName)
            : extensionOverride;
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ".pdf";
        }
        var filePath = Path.Combine(workDir, $"{Guid.NewGuid():N}{extension}");
        await using var stream = System.IO.File.OpenWrite(filePath);
        await file.CopyToAsync(stream);
        return filePath;
    }

    private static bool CheckBinary(string name)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = name,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            startInfo.ArgumentList.Add("--version");
            using var process = Process.Start(startInfo);
            if (process is null) return false;
            process.WaitForExit(3000);
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    private static bool RunProcess(string fileName, string[] args, string workDir, out string error)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = fileName,
                WorkingDirectory = workDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            foreach (var arg in args)
            {
                startInfo.ArgumentList.Add(arg);
            }
            using var process = Process.Start(startInfo);
            if (process is null)
            {
                error = $"Failed to start {fileName}.";
                return false;
            }
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            process.WaitForExit();
            if (process.ExitCode != 0)
            {
                error = stderr.Result;
                if (string.IsNullOrWhiteSpace(error))
                {
                    error = stdout.Result;
                }
                return false;
            }
            error = string.Empty;
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    private static HashSet<int> ParsePageSelection(string pages, int totalPages)
    {
        var set = new HashSet<int>();
        var parts = pages.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var part in parts)
        {
            if (part.Contains('-'))
            {
                var bounds = part.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (bounds.Length != 2) continue;
                if (!int.TryParse(bounds[0], out var start) || !int.TryParse(bounds[1], out var end)) continue;
                start = Math.Clamp(start, 1, totalPages);
                end = Math.Clamp(end, 1, totalPages);
                if (end < start) (start, end) = (end, start);
                for (var i = start; i <= end; i += 1)
                {
                    set.Add(i);
                }
                continue;
            }
            if (int.TryParse(part, out var page))
            {
                if (page >= 1 && page <= totalPages)
                {
                    set.Add(page);
                }
            }
        }
        return set;
    }

}
