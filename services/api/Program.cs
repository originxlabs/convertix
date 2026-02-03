using Azure.Extensions.AspNetCore.Configuration.Secrets;

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
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.OperationFilter<PdfEditor.Api.Services.SwaggerFileUploadOperationFilter>();
});

var app = builder.Build();

app.UseCors();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.DocumentTitle = "Convertix by OriginX Labs Pvt Ltd";
    // Use a relative endpoint so it works with reverse proxies / path bases.
    options.SwaggerEndpoint("v1/swagger.json", "Convertix by OriginX Labs Pvt Ltd");
});

app.MapControllers();

app.Run();
