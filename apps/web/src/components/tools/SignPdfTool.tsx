"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

type Position = "tl" | "tr" | "bl" | "br" | "c";

export default function SignPdfTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>("br");
  const [scale, setScale] = useState(0.2);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);

  const MAX_BYTES = 200 * 1024 * 1024;

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handlePickPdf = () => fileInputRef.current?.click();
  const handlePickSignature = () => signatureInputRef.current?.click();

  const validatePdf = (picked: File | null) => {
    if (!picked) return "Please select a PDF.";
    if (picked.type !== "application/pdf") return "Only PDF files are supported.";
    if (picked.size > MAX_BYTES) return "File is too large (max 200 MB).";
    return null;
  };

  const validateSignature = (picked: File | null) => {
    if (!picked) return "Please select a signature image.";
    if (!picked.type.startsWith("image/")) return "Only image files are supported for signatures.";
    if (picked.size > 20 * 1024 * 1024) return "Signature image is too large (max 20 MB).";
    return null;
  };

  const handleSign = async () => {
    if (!pdfFile || !signature) return;
    const pdfValidation = validatePdf(pdfFile);
    if (pdfValidation) {
      setStatus(pdfValidation);
      return;
    }
    const sigValidation = validateSignature(signature);
    if (sigValidation) {
      setStatus(sigValidation);
      return;
    }
    setStatus("Applying signature...");
    setProgress(0);
    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("signature", signature);
    formData.append("position", position);
    formData.append("scale", String(scale));
    const blob = await new Promise<Blob | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBase}/api/pdf/sign`);
      xhr.responseType = "blob";
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          const message = xhr.responseText || "Signature failed.";
          setStatus(message);
          resolve(null);
          return;
        }
        resolve(xhr.response);
      };
      xhr.onerror = () => {
        setStatus("Signature failed.");
        resolve(null);
      };
      xhr.send(formData);
    });
    if (!blob) return;
    await saveHistoryItem({
      name: `signed-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "signed.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Signed PDF downloaded.");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
              Signature
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Stamp placement</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handlePickPdf}>
              Upload PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePickSignature}>
              Upload Signature
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
        />
        <input
          ref={signatureInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => setSignature(event.target.files?.[0] ?? null)}
        />
        <div className="mt-6 grid gap-4 text-sm text-ink-900">
          <div className="grid gap-3 md:grid-cols-2">
            <div
              className={`rounded-2xl border border-dashed p-4 text-xs text-obsidian-500 transition ${
                isDraggingPdf
                  ? "border-ink-900/60 bg-white"
                  : "border-obsidian-200 bg-obsidian-50"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingPdf(true);
              }}
              onDragLeave={() => setIsDraggingPdf(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingPdf(false);
                setPdfFile(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              {pdfFile ? `PDF: ${pdfFile.name}` : "Drop PDF here"}
            </div>
            <div
              className={`rounded-2xl border border-dashed p-4 text-xs text-obsidian-500 transition ${
                isDraggingSignature
                  ? "border-ink-900/60 bg-white"
                  : "border-obsidian-200 bg-obsidian-50"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingSignature(true);
              }}
              onDragLeave={() => setIsDraggingSignature(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingSignature(false);
                setSignature(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              {signature ? `Signature: ${signature.name}` : "Drop signature image here"}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            Position
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value as Position)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            >
              <option value="tl">Top left</option>
              <option value="tr">Top right</option>
              <option value="bl">Bottom left</option>
              <option value="br">Bottom right</option>
              <option value="c">Center</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            Scale ({scale})
            <input
              type="range"
              min={0.1}
              max={0.4}
              step={0.05}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            Signature will be stamped on page 1.
          </div>
          <Button variant="premium" onClick={handleSign} disabled={!pdfFile || !signature}>
            Sign PDF
          </Button>
          {progress > 0 && progress < 100 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-obsidian-200">
              <div
                className="h-full rounded-full bg-ink-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
