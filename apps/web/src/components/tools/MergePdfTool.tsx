"use client";

import { useMemo, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

import { Button } from "@/components/ui/button";
import { applyAuthHeader } from "@/lib/auth";
import { saveHistoryItem } from "@/lib/historyStore";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type MergeItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number;
  thumbnail?: string;
};

export default function MergePdfTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<MergeItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const MAX_FILES = 500;
  const MAX_BYTES = 200 * 1024 * 1024;

  const handlePick = () => fileInputRef.current?.click();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const renderThumbnail = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { pages: pdf.numPages };
    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return { pages: pdf.numPages, thumbnail: canvas.toDataURL("image/png") };
  };

  const handleFiles = async (selected: FileList | null) => {
    if (!selected) return;
    const nextFiles = Array.from(selected);
    if (items.length + nextFiles.length > MAX_FILES) {
      setStatus(`You can merge up to ${MAX_FILES} files.`);
      return;
    }
    const valid = nextFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= MAX_BYTES
    );
    if (valid.length !== nextFiles.length) {
      setStatus("Only PDFs under 200 MB are supported.");
    }
    const mapped = await Promise.all(
      valid.map(async (file) => {
        const { pages, thumbnail } = await renderThumbnail(file);
        return {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          pages,
          thumbnail
        } as MergeItem;
      })
    );
    setItems((prev) => [...prev, ...mapped]);
  };

  const handleMerge = async () => {
    if (items.length < 2) return;
    setStatus("Merging PDFs...");
    setProgress(0);
    const formData = new FormData();
    items.forEach((item) => formData.append("files", item.file));
    const blob = await new Promise<Blob | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBase}/api/pdf/merge`);
      applyAuthHeader(xhr);
      xhr.responseType = "blob";
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          const message = xhr.responseText || "Merge failed.";
          setStatus(message);
          resolve(null);
          return;
        }
        resolve(xhr.response);
      };
      xhr.onerror = () => {
        setStatus("Merge failed.");
        resolve(null);
      };
      xhr.send(formData);
    });
    if (!blob) return;
    await saveHistoryItem({
      name: `merged-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "merged.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Merged PDF downloaded.");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
              Source PDFs
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Merge stack</h3>
          </div>
          <Button variant="premium" size="sm" onClick={handlePick}>
            Upload PDFs
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <div
          className={`mt-6 rounded-2xl border border-dashed p-4 text-sm text-obsidian-500 transition ${
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
            void handleFiles(event.dataTransfer.files);
          }}
        >
          {items.length > 0
            ? `${items.length} PDFs ready to merge.`
            : "Upload or drop PDFs to merge."}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex === null || dragIndex === index) return;
                setItems((prev) => {
                  const next = [...prev];
                  const [moved] = next.splice(dragIndex, 1);
                  next.splice(index, 0, moved);
                  return next;
                });
                setDragIndex(null);
              }}
              className="group relative cursor-move rounded-2xl border border-obsidian-200 bg-white p-3 shadow-sm transition hover:border-ink-900/30"
              style={{ resize: "both", overflow: "hidden" }}
              title={`${item.name} • ${formatBytes(item.size)} • ${item.pages} pages`}
            >
              <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border border-obsidian-100 bg-obsidian-50">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-obsidian-400">
                    Preview
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs font-semibold text-ink-900">{item.name}</div>
              <div className="text-[11px] text-obsidian-500">
                {item.pages} pages · {formatBytes(item.size)}
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-2 opacity-0 transition group-hover:opacity-100">
                <div className="rounded-full bg-ink-900/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {item.pages} pages
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handlePick}
            className="flex min-h-[220px] items-center justify-center rounded-2xl border-2 border-dashed border-obsidian-200 bg-obsidian-50 text-sm font-semibold text-obsidian-500 transition hover:border-ink-900/40 hover:bg-white"
          >
            + Add PDF ({items.length}/{MAX_FILES})
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            Drag to reorder, resize tiles, and hover to preview page counts.
          </div>
          <Button variant="premium" onClick={handleMerge} disabled={items.length < 2}>
            Merge PDFs
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
