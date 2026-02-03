"use client";

import { useEffect, useMemo, useState } from "react";

import ClientPdfEditor from "@/components/pdf/ClientPdfEditor";
import ImageEditTool from "@/components/tools/ImageEditTool";
import ImageResizeTool from "@/components/tools/ImageResizeTool";
import ImageToPdfTool from "@/components/tools/ImageToPdfTool";
import PdfToImageTool from "@/components/tools/PdfToImageTool";
import { Button } from "@/components/ui/button";

type ToolId = "pdf" | "resize" | "edit" | "pdf-to-image" | "image-to-pdf";

const toolMeta: Record<ToolId, { label: string; tagline: string }> = {
  pdf: {
    label: "PDF Studio",
    tagline: "Edit, annotate, and export with precision."
  },
  resize: {
    label: "Image Resize",
    tagline: "Resize with lock-ratio and export in seconds."
  },
  edit: {
    label: "Image Edit",
    tagline: "Polish brightness, contrast, and tone."
  },
  "pdf-to-image": {
    label: "PDF to Image",
    tagline: "Render PDF pages into premium image exports."
  },
  "image-to-pdf": {
    label: "Image to PDF",
    tagline: "Bundle images into a clean, shareable PDF."
  }
};

export default function ToolHub() {
  const [activeTool, setActiveTool] = useState<ToolId>("pdf");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const response = await fetch(`${apiBase}/health`);
        if (!isMounted) return;
        setApiStatus(response.ok ? "online" : "offline");
      } catch {
        if (!isMounted) return;
        setApiStatus("offline");
      }
    };
    void check();
    const timer = window.setInterval(check, 15000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [apiBase]);

  return (
    <section className="glass-card rounded-[28px] p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-obsidian-100 p-1">
          {(["pdf", "resize", "edit", "pdf-to-image", "image-to-pdf"] as ToolId[]).map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => setActiveTool(tool)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTool === tool
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-obsidian-500 hover:text-ink-900"
              }`}
            >
              {toolMeta[tool].label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-obsidian-500">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              apiStatus === "online" ? "bg-aurora-500" : apiStatus === "offline" ? "bg-accent-600" : "bg-obsidian-300"
            }`}
          />
          API {apiStatus === "checking" ? "checking" : apiStatus}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
            {toolMeta[activeTool].label}
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink-950">
            {toolMeta[activeTool].tagline}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="glass" size="sm">
            View Guides
          </Button>
          <Button size="sm">Start Now</Button>
        </div>
      </div>

      <div className="mt-6">
        {activeTool === "pdf" && <ClientPdfEditor />}
        {activeTool === "resize" && <ImageResizeTool />}
        {activeTool === "edit" && <ImageEditTool />}
        {activeTool === "pdf-to-image" && <PdfToImageTool />}
        {activeTool === "image-to-pdf" && <ImageToPdfTool />}
      </div>
    </section>
  );
}
