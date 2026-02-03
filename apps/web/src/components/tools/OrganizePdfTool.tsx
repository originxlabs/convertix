"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

export default function OrganizePdfTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("1,3,2");
  const [status, setStatus] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handlePick = () => fileInputRef.current?.click();

  const handleOrganize = async () => {
    if (!file) return;
    setStatus("Organizing pages...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("pages", pages);
    const response = await fetch(`${apiBase}/api/pdf/organize`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      setStatus("Organize failed.");
      return;
    }
    const blob = await response.blob();
    await saveHistoryItem({
      name: `organized-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "organized.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Organized PDF downloaded.");
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
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Page ordering</h3>
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
            Page order (comma-separated)
            <input
              type="text"
              value={pages}
              onChange={(event) => setPages(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            />
          </label>
          <div className="text-xs text-obsidian-500">
            Example: 1,3,2,4 or 1-2,5 for ranges.
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            The output PDF follows the page order you set.
          </div>
          <Button onClick={handleOrganize} disabled={!file}>
            Organize PDF
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
