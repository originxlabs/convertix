"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { nanoid } from "nanoid";

import { Button } from "@/components/ui/button";
import PdfPage from "@/components/pdf/PdfPage";
import { useEditorStore } from "@/lib/editorStore";
import type { EditorTool, TextOverlay } from "@/lib/editorTypes";
import { saveHistoryItem } from "@/lib/historyStore";

const PdfKonvaStage = dynamic(() => import("@/components/pdf/PdfKonvaStage"), {
  ssr: false
});

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const tools: EditorTool[] = [
  "Select",
  "Text",
  "Image",
  "Annotate",
  "Shape",
  "Form",
  "Sign",
  "Page"
];

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

export default function PdfEditor() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [viewportSize, setViewportSize] = useState({ width: 820, height: 1060 });
  const [scale, setScale] = useState(1.2);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMeta, setUploadMeta] = useState<{ name: string; size: number } | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadEta, setUploadEta] = useState<number | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const lastLoadedRef = useRef<number>(0);
  const uploadSpeedRef = useRef<number>(0);

  const { tool, setTool, doc, addOverlay, setDocMeta, setFileId } = useEditorStore();

  const handleSelectFile = async (file: File) => {
    lastFileRef.current = file;
    setUploadMeta({ name: file.name, size: file.size });
    const buffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: buffer });
    const loadedPdf = await loadingTask.promise;
    setPdfDoc(loadedPdf);
    setPageIndex(1);
    setDocMeta({ pageCount: loadedPdf.numPages, name: file.name });

    setUploadState("uploading");
    setUploadProgress(0);
    setUploadError(null);
    setUploadSpeed(0);
    setUploadEta(null);
    lastTickRef.current = null;
    lastLoadedRef.current = 0;
    uploadSpeedRef.current = 0;
    try {
      const fileId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiBase}/api/upload`);
        xhr.responseType = "json";
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          const now = Date.now();
          if (lastTickRef.current !== null) {
            const elapsedMs = now - lastTickRef.current;
            const loadedDelta = event.loaded - lastLoadedRef.current;
            if (elapsedMs > 0 && loadedDelta >= 0) {
              const instant = (loadedDelta / elapsedMs) * 1000;
              uploadSpeedRef.current =
                uploadSpeedRef.current === 0 ? instant : uploadSpeedRef.current * 0.7 + instant * 0.3;
              setUploadSpeed(uploadSpeedRef.current);
            }
          }
          lastTickRef.current = now;
          lastLoadedRef.current = event.loaded;
          if (uploadSpeedRef.current > 0) {
            const remaining = event.total - event.loaded;
            setUploadEta(Math.max(0, Math.ceil(remaining / uploadSpeedRef.current)));
          }
        };
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`Upload failed (${xhr.status})`));
            return;
          }
          const data = xhr.response as { fileId?: string } | null;
          if (!data?.fileId) {
            reject(new Error("Upload response missing fileId"));
            return;
          }
          resolve(data.fileId);
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        const formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
      });
      setFileId(fileId);
      setUploadProgress(100);
      setUploadState("done");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
      setUploadState("error");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRetryUpload = () => {
    if (lastFileRef.current) {
      void handleSelectFile(lastFileRef.current);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatEta = (seconds: number | null) => {
    if (seconds === null || !Number.isFinite(seconds)) return "—";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const onViewport = useCallback(
    (width: number, height: number) => {
      setViewportSize({ width, height });
      setDocMeta({ pageWidth: width / scale, pageHeight: height / scale });
    },
    [setDocMeta, scale]
  );

  const stageSize = useMemo(
    () => ({ width: viewportSize.width, height: viewportSize.height }),
    [viewportSize]
  );

  const handleStageClick = () => {
    if (tool !== "Text") return;
    const overlay: TextOverlay = {
      id: nanoid(),
      type: "text",
      page: pageIndex,
      x: 80 / scale,
      y: 120 / scale,
      width: 200 / scale,
      height: 40 / scale,
      text: "New text",
      fontSize: 20,
      color: "#1c2230"
    };
    addOverlay(overlay);
  };

  const handleExport = async () => {
    if (!doc.fileId) return;
    const normalizedOverlays = doc.overlays.map((overlay) => ({
      ...overlay,
      x: overlay.x,
      y: overlay.y,
      width: overlay.width,
      height: overlay.height
    }));

    const formData = new FormData();
    formData.append("fileId", doc.fileId);
    formData.append("edits", JSON.stringify(normalizedOverlays));
    formData.append("pageWidth", String(doc.pageWidth));
    formData.append("pageHeight", String(doc.pageHeight));

    const response = await fetch(`${apiBase}/api/export`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) return;
    const blob = await response.blob();
    await saveHistoryItem({
      name: `pdf-export-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edited.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full gap-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleSelectFile(file);
        }}
      />

      <aside className="glass-card w-56 rounded-2xl p-4">
        <div className="text-xs font-semibold uppercase text-obsidian-500">Pages</div>
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: doc.pageCount || 0 }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setPageIndex(page)}
              className={`rounded-xl border px-3 py-4 text-left text-sm transition ${
                pageIndex === page
                  ? "border-ink-900/80 bg-white"
                  : "border-obsidian-200 bg-obsidian-50"
              }`}
            >
              Page {page}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex flex-1 flex-col gap-4">
        <div className="glass-card flex flex-wrap items-center gap-2 rounded-2xl p-3">
          {tools.map((toolName) => (
            <Button
              key={toolName}
              variant={tool === toolName ? "default" : "secondary"}
              size="sm"
              onClick={() => setTool(toolName)}
            >
              {toolName}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUploadClick}
              disabled={uploadState === "uploading"}
            >
              Upload PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setScale((s) => s + 0.1)}>
              Zoom +
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}>
              Zoom -
            </Button>
            <Button size="sm" onClick={handleExport}>
              Export PDF
            </Button>
          </div>
        </div>
        {uploadState !== "idle" && (
          <div className="glass-card flex flex-col gap-2 rounded-2xl p-3 text-xs text-obsidian-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink-900">
                  {uploadMeta?.name ?? "Upload"}
                </div>
                <div className="text-[11px] text-obsidian-500">
                  Size: {uploadMeta ? formatBytes(uploadMeta.size) : "—"}
                </div>
              </div>
              {uploadState === "error" && (
                <Button variant="secondary" size="sm" onClick={handleRetryUpload}>
                  Retry
                </Button>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-obsidian-200">
              <div
                className="h-full rounded-full bg-ink-900 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>
                {uploadState === "uploading" && `Uploading ${uploadProgress}%`}
                {uploadState === "done" && "Upload complete"}
                {uploadState === "error" && (uploadError ?? "Upload failed")}
              </span>
              <span>
                Speed: {uploadSpeed > 0 ? `${formatBytes(uploadSpeed)}/s` : "—"} · ETA: {formatEta(uploadEta)}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-1 items-start gap-4">
          <div className="glass-card flex-1 rounded-2xl p-6">
            <div className="mb-4 text-sm text-obsidian-500">
              Inline canvas (PDF render + text selection + Konva overlay)
            </div>
            <div className="pdf-stage-wrapper">
              {pdfDoc ? (
                <>
                  <PdfPage
                    pdf={pdfDoc}
                    pageNumber={pageIndex}
                    scale={scale}
                    onViewport={onViewport}
                  />
                  <PdfKonvaStage
                    width={stageSize.width}
                    height={stageSize.height}
                    className="pdf-konva-layer"
                    onMouseDown={handleStageClick}
                    overlays={doc.overlays}
                    pageIndex={pageIndex}
                    scale={scale}
                  />
                </>
              ) : (
                <div className="flex h-[480px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-obsidian-200 bg-obsidian-50 text-sm text-obsidian-500">
                  <span>Upload a PDF to start editing</span>
                  {uploadState === "error" && (
                    <span className="text-xs text-red-600">{uploadError ?? "Upload failed"}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="glass-card w-72 rounded-2xl p-4">
            <div className="text-sm font-semibold text-ink-900">Inspector</div>
            <div className="mt-4 space-y-3 text-sm text-ink-900">
              <div className="rounded-lg bg-obsidian-50 p-3">
                Select an element to edit properties (font, size, color, opacity).
              </div>
              <div className="rounded-lg bg-obsidian-50 p-3">
                Tool presets and page actions appear here.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
