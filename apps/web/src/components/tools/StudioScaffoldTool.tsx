"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { getApiBase } from "@/lib/apiBase";

type StudioScaffoldToolProps = {
  title: string;
  eyebrow: string;
  description: string;
  accept: string;
  multiple?: boolean;
  primaryActionLabel: string;
  helperNotes: string[];
  disabledMessage?: string;
  endpoint: string;
  fileFieldName?: string;
  outputName?: string;
};

export default function StudioScaffoldTool({
  title,
  eyebrow,
  description,
  accept,
  multiple = false,
  primaryActionLabel,
  helperNotes,
  disabledMessage = "Processing pipeline is being connected.",
  endpoint,
  fileFieldName = "file",
  outputName = "output"
}: StudioScaffoldToolProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    setFiles(Array.from(selected));
    setStatus(null);
  };

  const handleAction = async () => {
    if (files.length === 0) return;
    setIsWorking(true);
    setStatus("Preparing conversion...");
    try {
      const first = files[0];
      if (!first) {
        setStatus("Please add a PDF to convert.");
        return;
      }
      if (!first.type.includes("pdf")) {
        setStatus("Only PDF files are supported for this conversion.");
        return;
      }
      const apiBase = getApiBase();
      const formData = new FormData();
      if (multiple || files.length > 1) {
        for (const file of files) {
          formData.append(fileFieldName, file);
        }
      } else {
        formData.append(fileFieldName, files[0]);
      }
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        const text = await response.text();
        setStatus(text || "Conversion failed. Please retry.");
        return;
      }
      const blob = await response.blob();
      const anchor = document.createElement("a");
      const url = URL.createObjectURL(blob);
      anchor.href = url;
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch =
        contentDisposition?.match(/filename="?([^\";]+)"?/i) ??
        contentDisposition?.match(/filename\\*=UTF-8''([^;]+)/i);
      const downloadName = fileNameMatch?.[1] ?? `${outputName}`;
      anchor.download = downloadName;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Conversion complete.");
      setTimeout(() => setStatus(null), 2500);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : disabledMessage);
    } finally {
      setIsWorking(false);
    }
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
          multiple={multiple}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="mt-6 rounded-2xl border border-dashed border-obsidian-200 bg-obsidian-50 p-6 text-sm text-obsidian-500">
          {files.length > 0
            ? `${files.length} file${files.length === 1 ? "" : "s"} selected.`
            : "Upload files to prepare the conversion."}
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
          <Button onClick={handleAction} disabled={files.length === 0 || isWorking}>
            {primaryActionLabel}
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
