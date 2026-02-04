using System.Diagnostics;
using System.Globalization;

namespace PdfEditor.Api.Services;

public static class PdfCpuRunner
{
    private static bool RunProcess(string[] args, string workDir, out string stdout, out string error)
    {
        stdout = string.Empty;
        error = string.Empty;
        try
        {
            var configuredPath = Environment.GetEnvironmentVariable("PDFCPU_PATH");
            var binaryPath = string.IsNullOrWhiteSpace(configuredPath) ? "pdfcpu" : configuredPath;
            if (!string.IsNullOrWhiteSpace(configuredPath) && !File.Exists(configuredPath))
            {
                error = $"PDFCPU binary not found at '{configuredPath}'.";
                return false;
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = binaryPath,
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
                error = "Failed to start pdfcpu process.";
                return false;
            }

            stdout = process.StandardOutput.ReadToEnd();
            var stderr = process.StandardError.ReadToEnd();
            process.WaitForExit();
            if (process.ExitCode != 0)
            {
                error = string.IsNullOrWhiteSpace(stderr)
                    ? $"pdfcpu failed with exit code {process.ExitCode}."
                    : stderr;
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    public static bool Run(string[] args, string workDir, out string error)
    {
        var ok = RunProcess(args, workDir, out _, out error);
        return ok;
    }

    public static string Fmt(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);

    public static bool TryGetPageCount(string inputPath, string workDir, out int pages, out string error)
    {
        pages = 0;
        var ok = RunProcess(new[] { "info", "--", inputPath }, workDir, out var output, out error);
        if (!ok)
        {
            return false;
        }

        var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var line in lines)
        {
            if (!line.StartsWith("Pages", StringComparison.OrdinalIgnoreCase)) continue;
            var parts = line.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length < 2) continue;
            if (int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var count))
            {
                pages = count;
                return true;
            }
        }
        error = "Unable to parse page count.";
        return false;
    }
}
