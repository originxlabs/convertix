"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { applyAuthHeader } from "@/lib/auth";
import { saveHistoryItem } from "@/lib/historyStore";

export default function PageNumbersTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState("bc");
  const [opacity, setOpacity] = useState("0.6");
  const [scale, setScale] = useState("0.35");
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const MAX_BYTES = 200 * 1024 * 1024;

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handlePick = () => fileInputRef.current?.click();

  const validateFile = (picked: File | null) => {
    if (!picked) return "Please select a PDF.";
    if (picked.type !== "application/pdf") return "Only PDF files are supported.";
    if (picked.size > MAX_BYTES) return "File is too large (max 200 MB).";
    return null;
  };

  const handleAdd = async () => {
    if (!file) return;
    const validation = validateFile(file);
    if (validation) {
      setStatus(validation);
      return;
    }
    setStatus("Adding page numbers...");
    setProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("position", position);
    formData.append("opacity", opacity);
    formData.append("scale", scale);

    const blob = await new Promise<Blob | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBase}/api/pdf/page-numbers`);
      applyAuthHeader(xhr);
      xhr.responseType = "blob";
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          setStatus(xhr.responseText || "Page numbers failed.");
          resolve(null);
          return;
        }
        resolve(xhr.response);
      };
      xhr.onerror = () => {
        setStatus("Page numbers failed.");
        resolve(null);
      };
      xhr.send(formData);
    });

    if (!blob) return;
    await saveHistoryItem({
      name: `page-numbers-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "page-numbers.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Page numbered PDF downloaded.");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Source PDF</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Add page numbers</h3>
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
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <div className="mt-6 rounded-2xl border border-dashed border-obsidian-200 bg-obsidian-50 p-4 text-sm text-obsidian-500">
          {file ? `${file.name} ready.` : "Upload a PDF to number pages."}
        </div>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <label className="flex flex-col gap-2">
            Position
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            >
              <option value="bc">Bottom center</option>
              <option value="br">Bottom right</option>
              <option value="bl">Bottom left</option>
              <option value="tc">Top center</option>
              <option value="tr">Top right</option>
              <option value="tl">Top left</option>
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              Opacity
              <input
                type="text"
                value={opacity}
                onChange={(event) => setOpacity(event.target.value)}
                className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-2">
              Scale
              <input
                type="text"
                value={scale}
                onChange={(event) => setScale(event.target.value)}
                className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">Page numbers are applied to every page.</div>
          <Button variant="premium" onClick={handleAdd} disabled={!file}>
            Add Page Numbers
          </Button>
          {progress > 0 && progress < 100 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-obsidian-200">
              <div className="h-full rounded-full bg-ink-900 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
