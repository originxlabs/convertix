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

        var args = new[] { "collect", "-p", request.Pages, "--", inputPath, outputPath };
        var result = PdfCpuRunner.Run(args, workDir, out var error);
        if (!result)
        {
            return Problem($"pdfcpu failed: {error}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath);
        return File(bytes, "application/pdf", "organized.pdf");
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
        var scale = string.IsNullOrWhiteSpace(request.Scale) ? "0.2" : request.Scale;
        var desc = $"pos:{position}, off:20 20, scale:{scale} rel, rot:0";

        var args = new[]
        {
            "stamp", "add",
            "-pages", "1",
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

}
