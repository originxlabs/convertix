using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/pdf")]
public class DocExchangeController : ControllerBase
{
    public sealed class PdfToWordRequest
    {
        public IFormFile? File { get; set; }
    }

    [HttpPost("pdf-to-word")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> PdfToWord([FromForm] PdfToWordRequest request)
    {
        if (request.File is null)
        {
            return BadRequest("Missing PDF.");
        }

        var workDir = CreateWorkDir();
        var inputPath = await SaveFormFile(request.File, workDir, ".pdf");
        var textPath = Path.Combine(workDir, "content.txt");
        var docxPath = Path.Combine(workDir, "converted.docx");

        var textArgs = new[] { "-layout", inputPath, textPath };
        var textResult = RunProcess("pdftotext", textArgs, workDir, out var textError);
        if (!textResult)
        {
            return Problem($"pdftotext failed: {textError}");
        }

        var pandocArgs = new[] { textPath, "-f", "markdown", "-t", "docx", "-o", docxPath };
        var pandocResult = RunProcess("pandoc", pandocArgs, workDir, out var pandocError);
        if (!pandocResult)
        {
            return Problem($"pandoc failed: {pandocError}");
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(docxPath);
        return File(bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "converted.docx");
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
                error = $"Failed to start process '{fileName}'.";
                return false;
            }

            var stderr = process.StandardError.ReadToEnd();
            process.WaitForExit();
            if (process.ExitCode != 0)
            {
                error = stderr;
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
}
