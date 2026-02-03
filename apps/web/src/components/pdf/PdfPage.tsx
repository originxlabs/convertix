"use client";

import { useEffect, useRef } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist/legacy/build/pdf.mjs";

type PdfPageProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onViewport: (width: number, height: number) => void;
};

export default function PdfPage({ pdf, pageNumber, scale, onViewport }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderPage = async () => {
      const page: PDFPageProxy = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      if (cancelled) return;
      onViewport(viewport.width, viewport.height);

      const canvas = canvasRef.current;
      const textLayer = textLayerRef.current;
      if (!canvas || !textLayer) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
      const renderContext = {
        canvasContext: context,
        viewport
      };

      textLayer.innerHTML = "";
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;

      await page.render(renderContext).promise;

      const textContent = await page.getTextContent();
      const textLayerBuilder = new TextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport
      });
      await textLayerBuilder.render();
    };

    void renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, scale, onViewport]);

  return (
    <div className="pdf-page">
      <canvas ref={canvasRef} className="pdf-canvas" />
      <div ref={textLayerRef} className="pdf-text-layer" />
    </div>
  );
}
