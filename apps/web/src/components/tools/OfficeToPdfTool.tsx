"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { applyAuthHeader } from "@/lib/auth";
import { getApiBase } from "@/lib/apiBase";
import { saveHistoryItem } from "@/lib/historyStore";

type OfficeToPdfToolProps = {
  title: string;
  eyebrow: string;
  description: string;
  accept: string;
  endpoint: string;
  primaryActionLabel: string;
  helperNotes: string[];
};

export default function OfficeToPdfTool({
  title,
  eyebrow,
  description,
  accept,
  endpoint,
  primaryActionLabel,
  helperNotes
}: OfficeToPdfToolProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_BYTES = 200 * 1024 * 1024;
  const apiBase = useMemo(() => getApiBase(), []);

  const handlePick = () => fileInputRef.current?.click();

  const handleConvert = async () => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setStatus("File is too large (max 200 MB).");
      return;
    }
    setStatus("Converting to PDF...");
    setProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    const blob = await new Promise<Blob | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBase}${endpoint}`);
      applyAuthHeader(xhr);
      xhr.responseType = "blob";
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          const message = xhr.responseText || "Conversion failed.";
          setStatus(message);
          resolve(null);
          return;
        }
        resolve(xhr.response);
      };
      xhr.onerror = () => {
        setStatus("Conversion failed.");
        resolve(null);
      };
      xhr.send(formData);
    });
    if (!blob) return;
    await saveHistoryItem({
      name: `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "converted.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("PDF downloaded.");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
              {eyebrow}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">{title}</h3>
            <p className="mt-2 text-sm text-obsidian-500">{description}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handlePick}>
            Upload file
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
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
            setFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          {file ? `${file.name} ready for conversion.` : "Upload a file to convert to PDF."}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          {helperNotes.map((note) => (
            <div key={note} className="rounded-2xl bg-white px-4 py-3">
              {note}
            </div>
          ))}
          <Button variant="premium" onClick={handleConvert} disabled={!file}>
            {primaryActionLabel}
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
