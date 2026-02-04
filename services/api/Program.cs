using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var keyVaultUri = builder.Configuration["KEY_VAULT_URI"];
if (!string.IsNullOrWhiteSpace(keyVaultUri))
{
    builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), new Azure.Identity.DefaultAzureCredential());
}

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<PdfEditor.Api.Services.BillingStore>();
builder.Services.AddSingleton<PdfEditor.Api.Services.EmailService>();
builder.Services.AddSingleton<PdfEditor.Api.Services.UserStore>();
builder.Services.AddSingleton<PdfEditor.Api.Services.JwtTokenService>();
builder.Services.AddSingleton<PdfEditor.Api.Services.TokenRevocationStore>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.OperationFilter<PdfEditor.Api.Services.SwaggerFileUploadOperationFilter>();
});

var jwtKey = builder.Configuration["JWT_KEY"];
var env = builder.Environment.EnvironmentName;

if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (env == Environments.Production)
    {
        throw new InvalidOperationException("JWT_KEY is required in Production.");
    }

    Console.WriteLine("WARNING: JWT_KEY missing. Using dev fallback key.");
    jwtKey = "TEMP_DEV_KEY_CHANGE_ME";
}


builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "convertix",
            ValidAudience = "convertix",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var jti = context.Principal?.FindFirst("jti")?.Value;
                if (string.IsNullOrWhiteSpace(jti))
                {
                    return;
                }
                var store = context.HttpContext.RequestServices
                    .GetRequiredService<PdfEditor.Api.Services.TokenRevocationStore>();
                if (await store.IsRevokedAsync(jti))
                {
                    context.Fail("Token revoked.");
                }
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

var pdfcpuEnv = Environment.GetEnvironmentVariable("PDFCPU_PATH");
if (string.IsNullOrWhiteSpace(pdfcpuEnv))
{
    var bundledPdfCpu = Path.Combine(AppContext.BaseDirectory, "tools", "pdfcpu");
    if (File.Exists(bundledPdfCpu))
    {
        Environment.SetEnvironmentVariable("PDFCPU_PATH", bundledPdfCpu);
        Console.WriteLine($"pdfcpu: using bundled binary at {bundledPdfCpu}");
    }
    else
    {
        Console.WriteLine($"pdfcpu: bundled binary not found at {bundledPdfCpu}");
    }
}
else
{
    Console.WriteLine($"pdfcpu: using configured PDFCPU_PATH={pdfcpuEnv}");
    if (!File.Exists(pdfcpuEnv))
    {
        Console.WriteLine("pdfcpu: configured PDFCPU_PATH does not exist on disk.");
    }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.DocumentTitle = "Convertix by OriginX Labs Pvt Ltd";
    // Use a relative endpoint so it works with reverse proxies / path bases.
    options.SwaggerEndpoint("v1/swagger.json", "Convertix by OriginX Labs Pvt Ltd");
});

app.MapControllers();


app.Run();
