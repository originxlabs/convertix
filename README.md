# PDF Editor (Web)

Monorepo layout:
- `apps/web`: Next.js + shadcn/ui + Konva overlay layer
- `services/api`: ASP.NET Core 10 Web API (C# 14)
- `services/pdf-engine`: placeholder for pdfcpu CLI wrapper

## Quick start (after deps install)

### Web
```bash
cd apps/web
npm install
npm run dev
```

### API
```bash
cd services/api
dotnet restore
dotnet run
```

## Notes
- PDF rendering uses `pdfjs-dist` on the client.
- Editing overlay uses `konva` via `react-konva`.
- Export calls API endpoints that run `pdfcpu` to apply edits and return the final PDF.
