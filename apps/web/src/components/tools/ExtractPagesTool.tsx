"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { applyAuthHeader } from "@/lib/auth";
import { saveHistoryItem } from "@/lib/historyStore";

export default function ExtractPagesTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("1,3");
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

  const handleExtract = async () => {
    if (!file) return;
    const validation = validateFile(file);
    if (validation) {
      setStatus(validation);
      return;
    }
    setStatus("Extracting pages...");
    setProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("pages", pages);

    const blob = await new Promise<Blob | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBase}/api/pdf/extract`);
      applyAuthHeader(xhr);
      xhr.responseType = "blob";
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          setStatus(xhr.responseText || "Extract failed.");
          resolve(null);
          return;
        }
        resolve(xhr.response);
      };
      xhr.onerror = () => {
        setStatus("Extract failed.");
        resolve(null);
      };
      xhr.send(formData);
    });

    if (!blob) return;
    await saveHistoryItem({
      name: `extracted-pages-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "extracted.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Extracted PDF downloaded.");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Source PDF</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Extract pages</h3>
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
          {file ? `${file.name} ready.` : "Upload a PDF to extract pages."}
        </div>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <label className="flex flex-col gap-2">
            Pages to extract (comma-separated)
            <input
              type="text"
              value={pages}
              onChange={(event) => setPages(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            />
          </label>
          <div className="text-xs text-obsidian-500">Example: 1,3,5 or 1-2</div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">Only selected pages are exported.</div>
          <Button variant="premium" onClick={handleExtract} disabled={!file}>
            Extract Pages
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
