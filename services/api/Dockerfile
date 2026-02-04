FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY services/api/ ./services/api/
WORKDIR /src/services/api
RUN dotnet restore PdfEditor.Api.csproj
RUN dotnet publish PdfEditor.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    libreoffice \
    pandoc \
    poppler-utils \
    ocrmypdf \
    tesseract-ocr \
    ghostscript \
    qpdf \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish/ ./
COPY services/api/tools/pdfcpu/linux_amd64/pdfcpu /app/tools/pdfcpu
RUN chmod +x /app/tools/pdfcpu

ENV PDFCPU_PATH=/app/tools/pdfcpu

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "PdfEditor.Api.dll"]
