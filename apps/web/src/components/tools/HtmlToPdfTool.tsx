"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/auth";
import { getApiBase } from "@/lib/apiBase";
import { saveHistoryItem } from "@/lib/historyStore";

export default function HtmlToPdfTool() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const apiBase = useMemo(() => getApiBase(), []);

  const handleConvert = async () => {
    if (!url) {
      setStatus("Please enter a URL.");
      return;
    }
    setIsLoading(true);
    setStatus("Rendering PDF...");
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiBase}/api/pdf/html-to-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        const text = await response.text();
        setStatus(text || "Conversion failed.");
        setIsLoading(false);
        return;
      }
      const blob = await response.blob();
      await saveHistoryItem({
        name: `html-to-pdf-${new Date().toISOString().slice(0, 10)}`,
        blob,
        kind: "pdf"
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "page.pdf";
      link.click();
      URL.revokeObjectURL(link.href);
      setStatus("PDF downloaded.");
    } catch {
      setStatus("Conversion failed.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(null), 2500);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
          Source URL
        </p>
        <h3 className="mt-2 text-lg font-semibold text-ink-950">HTML to PDF</h3>
        <p className="mt-2 text-sm text-obsidian-500">
          Paste a web page URL and generate a PDF snapshot.
        </p>
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          className="mt-4 w-full rounded-2xl border border-obsidian-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm"
        />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            Best for static pages or print-friendly layouts.
          </div>
          <Button variant="premium" onClick={handleConvert} disabled={!url || isLoading}>
            {isLoading ? "Rendering..." : "Convert to PDF"}
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
