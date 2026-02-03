"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

export default function CropPdfTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [cropBox, setCropBox] = useState("10");
  const [status, setStatus] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handlePick = () => fileInputRef.current?.click();

  const handleCrop = async () => {
    if (!file) return;
    setStatus("Cropping PDF...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cropBox", cropBox);
    if (pages.trim()) formData.append("pages", pages);
    const response = await fetch(`${apiBase}/api/pdf/crop`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      setStatus("Crop failed.");
      return;
    }
    const blob = await response.blob();
    await saveHistoryItem({
      name: `cropped-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cropped.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Cropped PDF downloaded.");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
              Source PDF
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Crop settings</h3>
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
        <div className="mt-6 grid gap-4 text-sm text-ink-900">
          <label className="flex flex-col gap-2">
            Crop box (pdfcpu syntax)
            <input
              type="text"
              value={cropBox}
              onChange={(event) => setCropBox(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2">
            Pages (optional)
            <input
              type="text"
              value={pages}
              onChange={(event) => setPages(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
              placeholder="e.g. 1-3,6"
            />
          </label>
          <div className="text-xs text-obsidian-500">
            Example crop: `10` (10pt margins) or `pos:br, off:-10 -10, dim:50% 50% rel`.
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            Crop uses pdfcpu syntax for maximum precision.
          </div>
          <Button onClick={handleCrop} disabled={!file}>
            Crop PDF
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
