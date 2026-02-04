"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { nanoid } from "nanoid";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Cloud, Download, HardDrive } from "lucide-react";

import { Button } from "@/components/ui/button";
import PdfPage from "@/components/pdf/PdfPage";
import PdfThumbnail from "@/components/pdf/PdfThumbnail";
import { useEditorStore } from "@/lib/editorStore";
import type { EditorTool, TextOverlay, ImageOverlay, ShapeOverlay, SignatureOverlay } from "@/lib/editorTypes";
import { saveHistoryItem } from "@/lib/historyStore";
import { applyAuthHeader } from "@/lib/auth";

const PdfFabricStage = dynamic(() => import("@/components/pdf/PdfFabricStage"), {
  ssr: false
});

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

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
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [viewportSize, setViewportSize] = useState({ width: 820, height: 1060 });
  const [scale, setScale] = useState(1.2);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMeta, setUploadMeta] = useState<{ name: string; size: number } | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadEta, setUploadEta] = useState<number | null>(null);
  const [sourcePdfBytes, setSourcePdfBytes] = useState<Uint8Array | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportState, setExportState] = useState<"idle" | "exporting">("idle");
  const [exportSize, setExportSize] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    editing: boolean;
    selectedId?: string;
    lastEvent?: string;
    fabricReady?: boolean;
  }>({ editing: false });
  const lastFileRef = useRef<File | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const lastLoadedRef = useRef<number>(0);
  const uploadSpeedRef = useRef<number>(0);

  const {
    tool,
    setTool,
    doc,
    addOverlay,
    setDocMeta,
    setFileId,
    selectedId,
    selectOverlay,
    updateOverlay,
    removeOverlay,
    undo,
    redo,
    past,
    future
  } = useEditorStore();

  const handleSelectFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files can be edited here. Use Image tools for images.");
      setUploadState("error");
      return;
    }
    lastFileRef.current = file;
    setUploadMeta({ name: file.name, size: file.size });
    const buffer = await file.arrayBuffer();
    setSourcePdfBytes(new Uint8Array(buffer));
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
        applyAuthHeader(xhr);
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
            const detail =
              typeof xhr.response === "string"
                ? xhr.response
                : xhr.responseText || "Unknown error";
            reject(new Error(`Upload failed (${xhr.status}): ${detail}`));
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

  const handleGoogleDriveUpload = () => {};

  const handleGoogleDriveSave = () => {};

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleSignatureClick = () => {
    signatureInputRef.current?.click();
  };

  const handleDropFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void handleSelectFile(file);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleDropFiles(event.dataTransfer?.files ?? null);
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

  const addTextAt = (x: number, y: number, text?: string, width?: number, height?: number) => {
    const overlay: TextOverlay = {
      id: nanoid(),
      type: "text",
      page: pageIndex,
      x,
      y,
      width: width ? width / scale : 200 / scale,
      height: height ? height / scale : 40 / scale,
      text: text ?? "New text",
      fontSize: 20,
      color: "#1c2230"
    };
    addOverlay(overlay);
    selectOverlay(overlay.id);
    setPendingEditId(overlay.id);
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (editMode) {
      addTextAt(x, y);
      setDebugInfo((prev) => ({ ...prev, lastEvent: "canvas:click" }));
    }
  };

  const handleStageClick = () => {
    if (tool === "Text") {
      addTextAt(80 / scale, 120 / scale);
      return;
    }

    if (tool === "Shape") {
      const overlay: ShapeOverlay = {
        id: nanoid(),
        type: "shape",
        shape: "rect",
        page: pageIndex,
        x: 100 / scale,
        y: 140 / scale,
        width: 180 / scale,
        height: 80 / scale,
        stroke: "#1c2230",
        strokeWidth: 2,
        fill: "transparent"
      };
      addOverlay(overlay);
      selectOverlay(overlay.id);
      return;
    }

    if (tool === "Annotate") {
      const overlay: ShapeOverlay = {
        id: nanoid(),
        type: "shape",
        shape: "rect",
        page: pageIndex,
        x: 90 / scale,
        y: 130 / scale,
        width: 220 / scale,
        height: 36 / scale,
        stroke: "#f59e0b",
        strokeWidth: 1,
        fill: "rgba(251, 191, 36, 0.35)"
      };
      addOverlay(overlay);
      selectOverlay(overlay.id);
      return;
    }

    if (tool === "Form") {
      const fieldBox: ShapeOverlay = {
        id: nanoid(),
        type: "shape",
        shape: "rect",
        page: pageIndex,
        x: 100 / scale,
        y: 160 / scale,
        width: 240 / scale,
        height: 44 / scale,
        stroke: "#2563eb",
        strokeWidth: 1,
        fill: "transparent"
      };
      addOverlay(fieldBox);
      selectOverlay(fieldBox.id);

      const fieldLabel: TextOverlay = {
        id: nanoid(),
        type: "text",
        page: pageIndex,
        x: (100 + 8) / scale,
        y: (160 + 10) / scale,
        width: 200 / scale,
        height: 24 / scale,
        text: "Field",
        fontSize: 14,
        color: "#2563eb"
      };
      addOverlay(fieldLabel);
      return;
    }

    selectOverlay(undefined);
  };

  const addImageOverlay = async (file: File, kind: "image" | "signature") => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 240;
        const ratio = img.width > 0 ? maxWidth / img.width : 1;
        const width = img.width * ratio;
        const height = img.height * ratio;
        const base: ImageOverlay | SignatureOverlay =
          kind === "image"
            ? {
                id: nanoid(),
                type: "image",
                page: pageIndex,
                x: 80 / scale,
                y: 120 / scale,
                width: width / scale,
                height: height / scale,
                src: dataUrl
              }
            : {
                id: nanoid(),
                type: "signature",
                method: "image",
                data: dataUrl,
                page: pageIndex,
                x: 80 / scale,
                y: 120 / scale,
                width: width / scale,
                height: height / scale
              };
        addOverlay(base);
        selectOverlay(base.id);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const hexToRgb = (hex: string) => {
    const normalized = hex.replace("#", "");
    const value =
      normalized.length === 3
        ? normalized
            .split("")
            .map((c) => c + c)
            .join("")
        : normalized;
    const intVal = Number.parseInt(value, 16);
    return {
      r: ((intVal >> 16) & 255) / 255,
      g: ((intVal >> 8) & 255) / 255,
      b: (intVal & 255) / 255
    };
  };

  const dataUrlToBytes = (dataUrl: string) => {
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const handleExport = async () => {
    if (!sourcePdfBytes || sourcePdfBytes.length < 4) {
      setExportError("Please upload a PDF before exporting.");
      setExportState("idle");
      return;
    }
    setExportState("exporting");
    setExportSize(null);
    setExportError(null);
    const normalizedOverlays = doc.overlays.map((overlay) => ({
      ...overlay,
      x: overlay.x,
      y: overlay.y,
      width: overlay.width,
      height: overlay.height
    }));

    try {
      const pdfDoc = await PDFDocument.load(sourcePdfBytes);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const overlay of normalizedOverlays) {
        const page = pdfDoc.getPage(Math.max(0, overlay.page - 1));
        const pageWidth = doc.pageWidth || page.getWidth();
        const pageHeight = doc.pageHeight || page.getHeight();
        const pdfY = pageHeight - overlay.y - overlay.height;

        if (overlay.type === "text") {
          const color = hexToRgb(overlay.color);
          page.drawText(overlay.text ?? "", {
            x: overlay.x,
            y: pdfY,
            size: overlay.fontSize ?? 16,
            font: helvetica,
            color: rgb(color.r, color.g, color.b)
          });
        }

        if (overlay.type === "shape") {
          const stroke = hexToRgb(overlay.stroke ?? "#111111");
          const fill = overlay.fill ? hexToRgb(overlay.fill) : null;
          page.drawRectangle({
            x: overlay.x,
            y: pdfY,
            width: overlay.width,
            height: overlay.height,
            borderWidth: overlay.strokeWidth ?? 1,
            borderColor: rgb(stroke.r, stroke.g, stroke.b),
            color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
            opacity: overlay.fill ? 0.35 : 1
          });
        }

        if (overlay.type === "image" || overlay.type === "signature") {
          const dataUrl =
            (overlay as { src?: string; data?: string }).src ??
            (overlay as { data?: string }).data ??
            "";
          if (!dataUrl) continue;
          const bytes = dataUrlToBytes(dataUrl);
          const isPng = dataUrl.startsWith("data:image/png");
          const isJpg =
            dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg");
          const image = isPng
            ? await pdfDoc.embedPng(bytes)
            : isJpg
              ? await pdfDoc.embedJpg(bytes)
              : await pdfDoc.embedPng(bytes);
          page.drawImage(image, {
            x: overlay.x,
            y: pdfY,
            width: overlay.width,
            height: overlay.height
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      setExportSize(blob.size);
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
    } finally {
      setExportState("idle");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? event.metaKey : event.ctrlKey;
      if (!modKey) return;

      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  const selectedOverlay = useMemo(
    () => doc.overlays.find((overlay) => overlay.id === selectedId),
    [doc.overlays, selectedId]
  );

  return (
    <div
      className="flex h-full w-full flex-col gap-6 lg:flex-row"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void addImageOverlay(file, "image");
        }}
      />
      <input
        ref={signatureInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void addImageOverlay(file, "signature");
        }}
      />

      <aside className="glass-card w-full rounded-2xl p-4 lg:w-56">
        <div className="text-xs font-semibold uppercase text-obsidian-500">Document</div>
        <div className="mt-3 rounded-xl border border-obsidian-200 bg-white px-3 py-2 text-xs text-obsidian-600">
          <div className="text-sm font-semibold text-ink-900">{doc.name ?? "Untitled PDF"}</div>
          <div className="mt-1 flex items-center justify-between">
            <span>{doc.pageCount || 0} pages</span>
            <span>
              {doc.pageWidth > 0 && doc.pageHeight > 0
                ? `${Math.round(doc.pageWidth)}×${Math.round(doc.pageHeight)}`
                : "—"}
            </span>
          </div>
        </div>
        <div className="mt-4 text-xs font-semibold uppercase text-obsidian-500">Pages</div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-y-auto lg:pb-3 lg:pr-1">
          {pdfDoc
            ? Array.from({ length: doc.pageCount || 0 }, (_, index) => index + 1).map((page) => (
                <PdfThumbnail
                  key={page}
                  pdf={pdfDoc}
                  pageNumber={page}
                  isActive={pageIndex === page}
                  onClick={() => setPageIndex(page)}
                />
              ))
            : Array.from({ length: doc.pageCount || 0 }, (_, index) => index + 1).map((page) => (
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
              variant="premium"
              size="sm"
              onClick={handleUploadClick}
              disabled={uploadState === "uploading"}
            >
              <HardDrive className="h-4 w-4" />
              Upload PDF
            </Button>
            <Button
              variant={editMode ? "default" : "secondary"}
              size="sm"
              onClick={() => setEditMode((prev) => !prev)}
            >
              {editMode ? "Editing" : "Edit"}
            </Button>
            <div className="relative">
              <Button variant="secondary" size="sm" onClick={handleGoogleDriveUpload} disabled>
                <Cloud className="h-4 w-4" />
                Google Drive
              </Button>
              <span className="pointer-events-none absolute -top-2 right-2 rounded-full bg-obsidian-900/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
                Coming Soon
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={undo}
              disabled={past.length === 0}
            >
              Undo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={redo}
              disabled={future.length === 0}
            >
              Redo
            </Button>
            {tool === "Image" && (
              <Button variant="secondary" size="sm" onClick={handleImageClick}>
                Add Image
              </Button>
            )}
            {tool === "Sign" && (
              <Button variant="secondary" size="sm" onClick={handleSignatureClick}>
                Add Signature
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setScale((s) => s + 0.1)}>
              Zoom +
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}>
              Zoom -
            </Button>
            <Button size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <div className="relative">
              <Button variant="secondary" size="sm" onClick={handleGoogleDriveSave} disabled>
                <Cloud className="h-4 w-4" />
                Save to Drive
              </Button>
              <span className="pointer-events-none absolute -top-2 right-2 rounded-full bg-obsidian-900/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
                Coming Soon
              </span>
            </div>
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

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <div className="glass-card flex-1 rounded-2xl p-4 md:p-6">
            <div className="mb-4 text-sm text-obsidian-500">
              Inline canvas (PDF render + text selection + Konva overlay)
            </div>
            <div
              className={`pdf-stage-wrapper ${isDragging ? "ring-2 ring-ink-900/40" : ""}`}
              onDoubleClick={(event) => {
                if (!editMode && tool !== "Text") return;
                const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x = Math.max(0, event.clientX - rect.left - 18);
                const y = Math.max(0, event.clientY - rect.top - 18);
                addTextAt(x / scale, y / scale);
              }}
            >
              {editMode && (
                <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-ink-900/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  Click anywhere to add text
                </div>
              )}
              {pdfDoc ? (
                <>
                  <PdfPage
                    pdf={pdfDoc}
                    pageNumber={pageIndex}
                    scale={scale}
                    onViewport={onViewport}
                    allowTextSelection={!editMode}
                    onTextDoubleClick={({ text, x, y, width, height }) =>
                      addTextAt(x / scale, y / scale, text, width, height)
                    }
                  />
                  <PdfFabricStage
                    width={stageSize.width}
                    height={stageSize.height}
                    className="pdf-fabric-layer"
                    onMouseDown={handleStageClick}
                    onAddTextAt={(x, y) => addTextAt(x, y)}
                    onCanvasClick={(x, y) => handleCanvasClick(x, y)}
                    pendingEditId={pendingEditId}
                    onPendingEditHandled={() => setPendingEditId(null)}
                    overlays={doc.overlays}
                    pageIndex={pageIndex}
                    scale={scale}
                    selectedId={selectedId}
                    onSelectOverlay={(id) => selectOverlay(id)}
                    onMoveOverlay={(id, x, y) => updateOverlay(id, { x, y })}
                    onTextChange={(id, text) => updateOverlay(id, { text })}
                    onReady={(ready) =>
                      setDebugInfo((prev) => ({ ...prev, fabricReady: ready, lastEvent: "fabric:ready" }))
                    }
                    onEditingChange={(editing, id) =>
                      setDebugInfo((prev) => ({
                        ...prev,
                        editing,
                        selectedId: id ?? prev.selectedId,
                        lastEvent: editing ? "text:editing:entered" : "text:editing:exited"
                      }))
                    }
                    onSelectionChange={(id) =>
                      setDebugInfo((prev) => ({
                        ...prev,
                        selectedId: id,
                        lastEvent: id ? "selection:created/updated" : "selection:cleared"
                      }))
                    }
                  />
                  <div className="pointer-events-none absolute left-4 bottom-4 rounded-xl border border-obsidian-200 bg-white/90 px-3 py-2 text-[11px] text-obsidian-700 shadow-sm">
                    <div className="font-semibold text-ink-900">Debug</div>
                    <div>Editing: {debugInfo.editing ? "yes" : "no"}</div>
                    <div>Selected: {debugInfo.selectedId ?? "none"}</div>
                    <div>Fabric: {debugInfo.fabricReady ? "ready" : "not ready"}</div>
                    <div>Last: {debugInfo.lastEvent ?? "—"}</div>
                  </div>
                  {isDragging && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-ink-900/50 bg-white/80 text-sm font-semibold text-ink-900">
                      Drop a PDF to replace the current document
                    </div>
                  )}
                </>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-obsidian-200 bg-obsidian-50 px-4 text-center text-sm text-obsidian-500">
                  <span className="font-semibold text-ink-900">Drop a PDF here to start editing</span>
                  <span>Or use the premium Upload button above.</span>
                  <Button variant="premium" size="sm" onClick={handleUploadClick}>
                    Upload PDF
                  </Button>
                  {uploadState === "error" && (
                    <span className="text-xs text-red-600">{uploadError ?? "Upload failed"}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="glass-card w-full rounded-2xl p-4 lg:w-72">
            <div className="text-sm font-semibold text-ink-900">Inspector</div>
            <div className="mt-4 space-y-3 text-sm text-ink-900">
              {selectedOverlay?.type === "text" ? (
                <>
                  <div className="rounded-lg bg-obsidian-50 p-3">
                    <label className="text-xs font-semibold uppercase text-obsidian-500">
                      Text
                    </label>
                    <textarea
                      className="mt-2 w-full rounded-lg border border-obsidian-200 bg-white p-2 text-sm"
                      rows={3}
                      value={selectedOverlay.text}
                      onChange={(event) =>
                        updateOverlay(selectedOverlay.id, { text: event.target.value })
                      }
                    />
                  </div>
                  <div className="rounded-lg bg-obsidian-50 p-3">
                    <label className="text-xs font-semibold uppercase text-obsidian-500">
                      Font Size
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={64}
                      value={selectedOverlay.fontSize}
                      onChange={(event) =>
                        updateOverlay(selectedOverlay.id, {
                          fontSize: Number(event.target.value)
                        })
                      }
                      className="mt-2 w-full"
                    />
                    <div className="mt-1 text-xs text-obsidian-500">
                      {selectedOverlay.fontSize}px
                    </div>
                  </div>
                  <div className="rounded-lg bg-obsidian-50 p-3">
                    <label className="text-xs font-semibold uppercase text-obsidian-500">
                      Color
                    </label>
                    <input
                      type="color"
                      value={selectedOverlay.color}
                      onChange={(event) =>
                        updateOverlay(selectedOverlay.id, { color: event.target.value })
                      }
                      className="mt-2 h-10 w-full cursor-pointer rounded-md border border-obsidian-200"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => removeOverlay(selectedOverlay.id)}
                  >
                    Delete Text
                  </Button>
                </>
              ) : selectedOverlay?.type === "shape" ? (
                <>
                  <div className="rounded-lg bg-obsidian-50 p-3">
                    <div className="text-xs font-semibold uppercase text-obsidian-500">
                      Shape
                    </div>
                    <div className="mt-2 text-sm">Rectangle</div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => removeOverlay(selectedOverlay.id)}
                  >
                    Delete Shape
                  </Button>
                </>
              ) : selectedOverlay?.type === "image" ||
                selectedOverlay?.type === "signature" ? (
                <>
                  <div className="rounded-lg bg-obsidian-50 p-3">
                    <div className="text-xs font-semibold uppercase text-obsidian-500">
                      {selectedOverlay.type === "image" ? "Image" : "Signature"}
                    </div>
                    <div className="mt-2 text-sm">Drag on canvas to reposition.</div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => removeOverlay(selectedOverlay.id)}
                  >
                    Delete {selectedOverlay.type === "image" ? "Image" : "Signature"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-obsidian-50 p-3">
                    Select an element to edit properties (font, size, color).
                  </div>
                  <div className="rounded-lg bg-obsidian-50 p-3">
                    Tip: choose the Text tool and click the page to add editable text.
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
      {exportState === "exporting" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-obsidian-200 border-t-ink-900" />
            <div className="mt-4 text-sm font-semibold text-ink-900">
              Exporting your PDF
            </div>
            <div className="mt-2 text-xs text-obsidian-500">
              File size: {exportSize ? formatBytes(exportSize) : "Calculating..."}
            </div>
            {exportError && (
              <div className="mt-2 text-xs text-red-600">{exportError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
