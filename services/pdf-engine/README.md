# pdfcpu integration

This service wraps the pdfcpu CLI. It will receive edit instructions from the API and apply them to a PDF.

Planned endpoints:
- `POST /apply` with `{ inputPath, outputPath, edits }`

Implementation will either:
- call `pdfcpu` directly as a subprocess, or
- link against a Go microservice that wraps pdfcpu logic.
