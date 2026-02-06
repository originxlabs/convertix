"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { deleteHistoryItem, getHistoryBlob, getHistoryItems, type HistoryMeta } from "@/lib/historyStore";

export default function HistoryGallery() {
  const [items, setItems] = useState<HistoryMeta[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const loadItems = async () => {
    const meta = await getHistoryItems();
    setItems(meta);
  };

  useEffect(() => {
    void loadItems();
    const handler = () => void loadItems();
    window.addEventListener("convertix-history-updated", handler);
    return () => window.removeEventListener("convertix-history-updated", handler);
  }, []);

  useEffect(() => {
    let active = true;
    const loadPreviews = async () => {
      const next: Record<string, string> = {};
      for (const item of items) {
        if (item.kind !== "image") continue;
        const blob = await getHistoryBlob(item.id);
        if (!blob) continue;
        next[item.id] = URL.createObjectURL(blob);
      }
      if (!active) return;
      setPreviews(next);
    };
    void loadPreviews();
    return () => {
      active = false;
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [items, previews]);

  const handleDownload = async (item: HistoryMeta) => {
    const blob = await getHistoryBlob(item.id);
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const ext =
      item.type.includes("zip") || item.kind === "archive"
        ? "zip"
        : item.type.includes("word") || item.kind === "doc"
          ? "docx"
          : item.type.includes("pdf")
            ? "pdf"
            : item.type.includes("jpeg")
              ? "jpg"
              : "png";
    link.download = `${item.name}.${ext}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section className="glass-card rounded-3xl p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
            Export History
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink-950">Recent outputs</h3>
        </div>
        <div className="text-xs text-obsidian-500">Stored locally on this device.</div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-obsidian-200 bg-obsidian-50 p-6 text-sm text-obsidian-500">
          Exported files will appear here. Start by editing a PDF or converting an image.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="soft-border rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                  <p className="text-xs text-obsidian-500">
                    {item.kind === "pdf"
                      ? "PDF export"
                      : item.kind === "doc"
                        ? "DOCX export"
                        : item.kind === "archive"
                          ? "ZIP export"
                          : item.kind === "pages"
                            ? "Pages export"
                            : "Image export"}{" "}
                    •{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-obsidian-100 px-3 py-1 text-xs font-semibold text-ink-900">
                  {item.kind.toUpperCase()}
                </span>
              </div>
              <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-obsidian-100 bg-obsidian-50">
                {item.kind === "image" && previews[item.id] ? (
                  <Image src={previews[item.id]} alt={item.name} className="max-h-32 rounded-lg object-cover" width={180} height={128} />
                ) : (
                  <div className="text-xs text-obsidian-500">
                    {item.kind === "archive"
                      ? "ZIP Ready"
                      : item.kind === "doc"
                        ? "DOCX Ready"
                        : item.kind === "pages"
                          ? "Pages Ready"
                        : "PDF Ready"}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" onClick={() => handleDownload(item)}>
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteHistoryItem(item.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
