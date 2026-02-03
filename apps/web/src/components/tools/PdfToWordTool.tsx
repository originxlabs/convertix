"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

export default function PdfToWordTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handlePick = () => fileInputRef.current?.click();

  const handleConvert = async () => {
    if (!file) return;
    setStatus("Converting to DOCX...");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${apiBase}/api/pdf/pdf-to-word`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      setStatus("Conversion failed.");
      return;
    }
    const blob = await response.blob();
    await saveHistoryItem({
      name: `pdf-to-word-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "doc"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "converted.docx";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("DOCX downloaded.");
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
            <h3 className="mt-2 text-lg font-semibold text-ink-950">PDF to DOCX</h3>
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
        <div className="mt-6 rounded-2xl border border-dashed border-obsidian-200 bg-obsidian-50 p-6 text-sm text-obsidian-500">
          {file ? `${file.name} ready for conversion.` : "Upload a PDF to convert to Word."}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            Conversion preserves text layout where possible.
          </div>
          <Button onClick={handleConvert} disabled={!file}>
            Convert to DOCX
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
