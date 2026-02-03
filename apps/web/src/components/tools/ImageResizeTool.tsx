"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

type ExportFormat = "image/png" | "image/jpeg" | "image/webp";

export default function ImageResizeTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [keepRatio, setKeepRatio] = useState(true);
  const [format, setFormat] = useState<ExportFormat>("image/png");
  const [quality, setQuality] = useState(0.9);
  const [name, setName] = useState("image");
  const originalSize = useRef({ width: 1200, height: 800 });

  const ratio = useMemo(() => {
    if (!originalSize.current.width || !originalSize.current.height) return 1;
    return originalSize.current.width / originalSize.current.height;
  }, [imageSrc]);

  const handlePick = () => fileInputRef.current?.click();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result?.toString() ?? null;
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        originalSize.current = { width: img.width, height: img.height };
        setWidth(img.width);
        setHeight(img.height);
        setName(file.name.replace(/\.[^.]+$/, ""));
        setImageSrc(src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleWidth = (value: number) => {
    const nextWidth = Math.max(1, Math.floor(value));
    setWidth(nextWidth);
    if (keepRatio) {
      setHeight(Math.max(1, Math.floor(nextWidth / ratio)));
    }
  };

  const handleHeight = (value: number) => {
    const nextHeight = Math.max(1, Math.floor(value));
    setHeight(nextHeight);
    if (keepRatio) {
      setWidth(Math.max(1, Math.floor(nextHeight * ratio)));
    }
  };

  const handleExport = async () => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          await saveHistoryItem({
            name: `${name}-resized`,
            blob,
            kind: "image"
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
          link.download = `${name}-resized.${ext}`;
          link.click();
          URL.revokeObjectURL(link.href);
        },
        format,
        quality
      );
    };
    img.src = imageSrc;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
              Source Image
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Preview</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={handlePick}>
            Upload Image
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-obsidian-200 bg-obsidian-50">
          {imageSrc ? (
            <img src={imageSrc} alt="Uploaded" className="max-h-[360px] max-w-full rounded-xl" />
          ) : (
            <div className="text-sm text-obsidian-500">Drop an image to begin resizing.</div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
          Export Settings
        </p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <label className="flex flex-col gap-2">
            Width (px)
            <input
              type="number"
              value={width}
              min={1}
              onChange={(event) => handleWidth(Number(event.target.value))}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2">
            Height (px)
            <input
              type="number"
              value={height}
              min={1}
              onChange={(event) => handleHeight(Number(event.target.value))}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={keepRatio}
              onChange={(event) => setKeepRatio(event.target.checked)}
            />
            Lock aspect ratio
          </label>
          <label className="flex flex-col gap-2">
            Format
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as ExportFormat)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
          {format !== "image/png" && (
            <label className="flex flex-col gap-2">
              Quality ({Math.round(quality * 100)}%)
              <input
                type="range"
                min={0.6}
                max={1}
                step={0.05}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
              />
            </label>
          )}
          <Button onClick={handleExport}>Download Resized</Button>
        </div>
      </div>
    </div>
  );
}
