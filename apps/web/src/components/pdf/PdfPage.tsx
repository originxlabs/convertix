"use client";

import { useEffect, useRef } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist/legacy/build/pdf.mjs";

type PdfPageProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onViewport: (width: number, height: number) => void;
  onTextDoubleClick?: (payload: { text: string; x: number; y: number; width: number; height: number }) => void;
  allowTextSelection?: boolean;
};

export default function PdfPage({
  pdf,
  pageNumber,
  scale,
  onViewport,
  onTextDoubleClick,
  allowTextSelection = false
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

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
    <div className="pdf-page" ref={pageRef}>
      <canvas ref={canvasRef} className="pdf-canvas" />
      <div
        ref={textLayerRef}
        className="pdf-text-layer"
        style={{ pointerEvents: allowTextSelection ? "auto" : "none" }}
        onDoubleClick={() => {
          if (!onTextDoubleClick || !pageRef.current) return;
          const selection = window.getSelection();
          const selectedText = selection?.toString().trim() ?? "";
          const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          if (!range) return;
          const rect = range.getBoundingClientRect();
          const pageRect = pageRef.current.getBoundingClientRect();
          if (!selectedText || rect.width === 0 || rect.height === 0) return;
          const x = rect.left - pageRect.left;
          const y = rect.top - pageRect.top;
          onTextDoubleClick({
            text: selectedText,
            x,
            y,
            width: rect.width,
            height: rect.height
          });
          selection?.removeAllRanges();
        }}
      />
    </div>
  );
}
