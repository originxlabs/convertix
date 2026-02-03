"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

type Mode = "span" | "page";

export default function SplitPdfTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("span");
  const [span, setSpan] = useState(1);
  const [pages, setPages] = useState("2,4,10");
  const [status, setStatus] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handlePick = () => fileInputRef.current?.click();

  const handleSplit = async () => {
    if (!file) return;
    setStatus("Splitting PDF...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    if (mode === "span") {
      formData.append("span", String(span));
    } else {
      formData.append("pages", pages);
    }
    const response = await fetch(`${apiBase}/api/pdf/split`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      setStatus("Split failed.");
      return;
    }
    const blob = await response.blob();
    await saveHistoryItem({
      name: `split-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "archive"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "split.zip";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Split ZIP downloaded.");
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
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Split settings</h3>
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
            Mode
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as Mode)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            >
              <option value="span">Split by span</option>
              <option value="page">Split before pages</option>
            </select>
          </label>
          {mode === "span" ? (
            <label className="flex flex-col gap-2">
              Pages per file
              <input
                type="number"
                min={1}
                value={span}
                onChange={(event) => setSpan(Number(event.target.value))}
                className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
              />
            </label>
          ) : (
            <label className="flex flex-col gap-2">
              Split before pages (comma-separated)
              <input
                type="text"
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
              />
            </label>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            Split PDFs are delivered as a ZIP archive.
          </div>
          <Button onClick={handleSplit} disabled={!file}>
            Split PDF
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
