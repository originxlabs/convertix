"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type StudioScaffoldToolProps = {
  title: string;
  eyebrow: string;
  description: string;
  accept: string;
  multiple?: boolean;
  primaryActionLabel: string;
  helperNotes: string[];
  disabledMessage?: string;
};

export default function StudioScaffoldTool({
  title,
  eyebrow,
  description,
  accept,
  multiple = false,
  primaryActionLabel,
  helperNotes,
  disabledMessage = "Processing pipeline is being connected."
}: StudioScaffoldToolProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    setFiles(Array.from(selected));
    setStatus(null);
  };

  const handleAction = () => {
    setStatus(disabledMessage);
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
          <Button onClick={handleAction} disabled={files.length === 0}>
            {primaryActionLabel}
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
