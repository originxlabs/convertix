using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace PdfEditor.Api.Services;

public sealed class SchemaValidationHostedService : IHostedService
{
    private readonly SchemaValidator _validator;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<SchemaValidationHostedService> _logger;

    public SchemaValidationHostedService(
        SchemaValidator validator,
        IHostEnvironment environment,
        ILogger<SchemaValidationHostedService> logger)
    {
        _validator = validator;
        _environment = environment;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var (ok, message, _) = await _validator.ValidateAsync();
        if (ok)
        {
            _logger.LogInformation("Schema validation OK.");
            return;
        }

        var failOnStartup = string.Equals(
            Environment.GetEnvironmentVariable("SCHEMA_VALIDATE_ON_STARTUP"),
            "true",
            StringComparison.OrdinalIgnoreCase);

        if (failOnStartup || _environment.IsProduction())
        {
            throw new InvalidOperationException($"Schema validation failed: {message}");
        }

        _logger.LogWarning("Schema validation skipped: {Message}", message);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
