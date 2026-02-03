var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.DocumentTitle = "Convertix by OriginX Labs Pvt Ltd";
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Convertix by OriginX Labs Pvt Ltd");
});

app.MapControllers();

app.Run();
