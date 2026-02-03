"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

export default function HtmlToImageTool() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("png");
  const [status, setStatus] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handleConvert = async () => {
    if (!url.trim()) return;
    setStatus("Rendering...");
    try {
      const response = await fetch(`${apiBase}/api/image/html-to-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format })
      });
      if (!response.ok) {
        const message = await response.text();
        setStatus(message || "Render failed.");
        return;
      }
      const blob = await response.blob();
      await saveHistoryItem({
        name: `html-to-image-${new Date().toISOString().slice(0, 10)}`,
        blob,
        kind: "image"
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rendered.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
      setStatus("Image downloaded.");
    } catch {
      setStatus("Render failed.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Source URL</p>
        <h3 className="mt-2 text-lg font-semibold text-ink-950">HTML to Image</h3>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <label className="flex flex-col gap-2">
            URL
            <input
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2">
            Format
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            Render a URL into a high-resolution image.
          </div>
          <Button variant="premium" onClick={handleConvert} disabled={!url.trim()}>
            Render Image
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
