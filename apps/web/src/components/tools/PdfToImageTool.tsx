"use client";

import { useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type ExportFormat = "image/png" | "image/jpeg";

export default function PdfToImageTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState("document");
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<ExportFormat>("image/png");
  const [quality, setQuality] = useState(0.9);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_BYTES = 200 * 1024 * 1024;

  const handlePick = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setStatus("Only PDF files are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("File is too large (max 200 MB).");
      return;
    }
    const buffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: buffer });
    const loaded = await loadingTask.promise;
    setPdfDoc(loaded);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setStatus(null);
  };

  const handleConvert = async () => {
    if (!pdfDoc) return;
    setStatus("Rendering pages...");
    setProgress(0);
    for (let pageIndex = 1; pageIndex <= pdfDoc.numPages; pageIndex += 1) {
      const page = await pdfDoc.getPage(pageIndex);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format, quality)
      );
      if (!blob) continue;
      const exportName = `${fileName}-page-${pageIndex}`;
      await saveHistoryItem({
        name: exportName,
        blob,
        kind: "image"
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${exportName}.${format === "image/png" ? "png" : "jpg"}`;
      link.click();
      URL.revokeObjectURL(link.href);
      setProgress(Math.round((pageIndex / pdfDoc.numPages) * 100));
    }
    setStatus("All pages exported.");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
              Source PDF
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Convert to images</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={handlePick}>
            Upload PDF
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <div
          className={`mt-6 rounded-2xl border border-dashed p-6 text-sm text-obsidian-500 transition ${
            isDragging
              ? "border-ink-900/60 bg-white"
              : "border-obsidian-200 bg-obsidian-50"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
        >
          {pdfDoc ? `${pdfDoc.numPages} pages ready to export.` : "Upload a PDF to begin."}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
          Export Settings
        </p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <label className="flex flex-col gap-2">
            Scale ({scale}x)
            <input
              type="range"
              min={1}
              max={3}
              step={0.5}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            Format
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as ExportFormat)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
            </select>
          </label>
          {format === "image/jpeg" && (
            <label className="flex flex-col gap-2">
              Quality ({Math.round(quality * 100)}%)
              <input
                type="range"
                min={0.6}
                max={1}
                step={0.05}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
              />
            </label>
          )}
          <Button variant="premium" onClick={handleConvert} disabled={!pdfDoc}>
            Convert & Download
          </Button>
          {progress > 0 && progress < 100 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-obsidian-200">
              <div
                className="h-full rounded-full bg-ink-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
