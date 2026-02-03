"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

type ExportFormat = "image/png" | "image/jpeg";

export default function ImageEditTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>("image/png");
  const [quality, setQuality] = useState(0.9);
  const [name, setName] = useState("image");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [rotation, setRotation] = useState(0);

  const filter = useMemo(
    () =>
      `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) grayscale(${grayscale}%)`,
    [brightness, contrast, saturate, grayscale]
  );

  const handlePick = () => fileInputRef.current?.click();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result?.toString() ?? null;
      if (!src) return;
      setName(file.name.replace(/\.[^.]+$/, ""));
      setImageSrc(src);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rotate = rotation % 360;
      const isPortrait = rotate === 90 || rotate === 270;
      canvas.width = isPortrait ? img.height : img.width;
      canvas.height = isPortrait ? img.width : img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = filter;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
    img.src = imageSrc;
  }, [imageSrc, filter, rotation]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        await saveHistoryItem({
          name: `${name}-edited`,
          blob,
          kind: "image"
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const ext = format === "image/png" ? "png" : "jpg";
        link.download = `${name}-edited.${ext}`;
        link.click();
        URL.revokeObjectURL(link.href);
      },
      format,
      quality
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
              Editing Canvas
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Live Preview</h3>
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
        <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-obsidian-200 bg-obsidian-50 p-4">
          {imageSrc ? (
            <canvas ref={canvasRef} className="max-h-[360px] max-w-full rounded-xl" />
          ) : (
            <div className="text-sm text-obsidian-500">Drop an image to start editing.</div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
          Adjustments
        </p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <label className="flex flex-col gap-2">
            Brightness ({brightness}%)
            <input
              type="range"
              min={60}
              max={140}
              value={brightness}
              onChange={(event) => setBrightness(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            Contrast ({contrast}%)
            <input
              type="range"
              min={60}
              max={140}
              value={contrast}
              onChange={(event) => setContrast(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            Saturation ({saturate}%)
            <input
              type="range"
              min={0}
              max={180}
              value={saturate}
              onChange={(event) => setSaturate(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            Grayscale ({grayscale}%)
            <input
              type="range"
              min={0}
              max={100}
              value={grayscale}
              onChange={(event) => setGrayscale(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            Rotation
            <select
              value={rotation}
              onChange={(event) => setRotation(Number(event.target.value))}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            >
              <option value={0}>0°</option>
              <option value={90}>90°</option>
              <option value={180}>180°</option>
              <option value={270}>270°</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            Export format
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as ExportFormat)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
            </select>
          </label>
          {format === "image/jpeg" && (
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
          <Button onClick={handleExport}>Download Edited</Button>
        </div>
      </div>
    </div>
  );
}
