using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace PdfEditor.Api.Services;

public sealed class SwaggerFileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasFile = context.ApiDescription.ParameterDescriptions
            .Any(p => string.Equals(p.Source?.Id, "Form", StringComparison.OrdinalIgnoreCase));

        if (!hasFile)
        {
            return;
        }

        var schema = new OpenApiSchema
        {
            Type = JsonSchemaType.Object,
            Properties = new Dictionary<string, IOpenApiSchema>()
        };

        foreach (var parameter in context.ApiDescription.ParameterDescriptions)
        {
            if (!string.Equals(parameter.Source?.Id, "Form", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var name = parameter.Name ?? "file";
            var isFile = string.Equals(parameter.Type?.Name, "IFormFile", StringComparison.OrdinalIgnoreCase)
                || string.Equals(parameter.Type?.Name, "IFormFileCollection", StringComparison.OrdinalIgnoreCase);

            if (isFile)
            {
                schema.Properties[name] = new OpenApiSchema
                {
                    Type = parameter.Type?.Name == "IFormFileCollection"
                        ? JsonSchemaType.Array
                        : JsonSchemaType.String,
                    Items = parameter.Type?.Name == "IFormFileCollection"
                        ? new OpenApiSchema { Type = JsonSchemaType.String, Format = "binary" }
                        : null,
                    Format = parameter.Type?.Name == "IFormFileCollection" ? null : "binary"
                };
                continue;
            }

            schema.Properties[name] = new OpenApiSchema { Type = JsonSchemaType.String };
        }

        operation.RequestBody ??= new OpenApiRequestBody();
        operation.RequestBody.Content!["multipart/form-data"] = new OpenApiMediaType
        {
            Schema = schema
        };
    }
}
