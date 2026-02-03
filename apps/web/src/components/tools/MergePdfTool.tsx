"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

export default function MergePdfTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    setFiles(Array.from(selected));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setStatus("Merging PDFs...");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await fetch(`${apiBase}/api/pdf/merge`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      setStatus("Merge failed.");
      return;
    }
    const blob = await response.blob();
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
          <Button variant="secondary" size="sm" onClick={handlePick}>
            Upload PDFs
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="mt-6 rounded-2xl border border-dashed border-obsidian-200 bg-obsidian-50 p-6 text-sm text-obsidian-500">
          {files.length > 0
            ? `${files.length} PDFs ready to merge.`
            : "Upload two or more PDFs to merge."}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            The merged PDF preserves the order you upload.
          </div>
          <Button onClick={handleMerge} disabled={files.length < 2}>
            Merge PDFs
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
