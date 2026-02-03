"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

type Field = {
  name: string;
  label: string;
  type: "text" | "number";
  placeholder?: string;
};

type ImageAiToolProps = {
  title: string;
  eyebrow: string;
  description: string;
  accept: string;
  endpoint: string;
  outputExtension: string;
  outputMime: string;
  helperNotes?: string[];
  fields?: Field[];
};

export default function ImageAiTool({
  title,
  eyebrow,
  description,
  accept,
  endpoint,
  outputExtension,
  outputMime,
  helperNotes = [],
  fields = []
}: ImageAiToolProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [fieldState, setFieldState] = useState<Record<string, string>>(
    fields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {} as Record<string, string>)
  );

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );
  const tier = useMemo(
    () => (process.env.NEXT_PUBLIC_TIER ?? "free").toLowerCase(),
    []
  );
  const isPro = tier === "pro" || tier === "enterprise";

  const MAX_BYTES = 200 * 1024 * 1024;

  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = (selected: FileList | null) => {
    if (!selected?.length) return;
    const next = selected[0];
    if (next.size > MAX_BYTES) {
      setStatus("File exceeds the 200 MB limit.");
      return;
    }
    setFile(next);
    setStatus(null);
  };

  const handleAction = async () => {
    if (!file || !isPro) return;
    setStatus("Processing...");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    Object.entries(fieldState).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBase}${endpoint}`);
      xhr.responseType = "blob";
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          const message = xhr.responseText || "Processing failed.";
          setStatus(message);
          resolve(null);
          return;
        }
        resolve(xhr.response);
      };
      xhr.onerror = () => {
        setStatus("Processing failed.");
        resolve(null);
      };
      xhr.send(formData);
    });

    if (!blob) return;

    await saveHistoryItem({
      name: `${file.name.replace(/\.[^.]+$/, "")}-${title.replace(/\s+/g, "-").toLowerCase()}`,
      blob,
      kind: "image"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${file.name.replace(/\.[^.]+$/, "")}.${outputExtension}`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Completed.");
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
          <Button variant="premium" size="sm" onClick={handlePick} disabled={!isPro}>
            Upload file
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
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
            handleFiles(event.dataTransfer.files);
          }}
        >
          {file ? `${file.name} selected.` : "Upload a file to prepare the AI workflow."}
        </div>
        {fields.length > 0 && (
          <div className="mt-6 grid gap-4 text-sm text-ink-900">
            {fields.map((field) => (
              <label key={field.name} className="flex flex-col gap-2">
                {field.label}
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={fieldState[field.name] ?? ""}
                  onChange={(event) =>
                    setFieldState((prev) => ({ ...prev, [field.name]: event.target.value }))
                  }
                  className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          {helperNotes.map((note) => (
            <div key={note} className="rounded-2xl bg-white px-4 py-3">
              {note}
            </div>
          ))}
          {!isPro && (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              Available on Pro and Enterprise tiers.
            </div>
          )}
          <Button variant="premium" onClick={handleAction} disabled={!file || !isPro}>
            Process
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
