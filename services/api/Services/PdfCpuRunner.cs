using System.Diagnostics;
using System.Globalization;

namespace PdfEditor.Api.Services;

public static class PdfCpuRunner
{
    public static bool Run(string[] args, string workDir, out string error)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "pdfcpu",
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

    public static string Fmt(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);
}
