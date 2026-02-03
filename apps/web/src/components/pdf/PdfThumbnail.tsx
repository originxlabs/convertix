"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

type PdfThumbnailProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  isActive?: boolean;
  onClick?: () => void;
};

export default function PdfThumbnail({ pdf, pageNumber, isActive, onClick }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [label, setLabel] = useState("Loading...");

  useEffect(() => {
    let cancelled = false;

    const renderThumb = async () => {
      try {
        const page: PDFPageProxy = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.18 });
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        await page.render({ canvasContext: context, viewport }).promise;
        setLabel(`Page ${pageNumber}`);
      } catch {
        setLabel(`Page ${pageNumber}`);
      }
    };

    void renderThumb();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-center gap-2 rounded-xl border p-2 text-left text-xs transition ${
        isActive ? "border-ink-900/80 bg-white" : "border-obsidian-200 bg-obsidian-50"
      }`}
    >
      <canvas ref={canvasRef} className="rounded-lg border border-obsidian-200 bg-white" />
      <span className="text-[11px] text-obsidian-600">{label}</span>
    </button>
  );
}
