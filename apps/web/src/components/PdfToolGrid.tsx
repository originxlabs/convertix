"use client";

import { useEffect, useMemo, useState } from "react";

import ToolCard from "@/components/ToolCard";
import type { ToolIconName } from "@/components/ToolIcon";
import { getApiBase } from "@/lib/apiBase";

type Category = "all" | "convert" | "optimize" | "security" | "edit";

const filters: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "convert", label: "Convert PDF" },
  { key: "edit", label: "Edit PDF" },
  { key: "optimize", label: "Optimize PDF" },
  { key: "security", label: "PDF Security" }
];

const tools: Array<{
  title: string;
  description: string;
  href: string;
  category: Category[];
  badge?: string;
  healthKey?: Array<"libreoffice" | "playwright" | "pandoc" | "pdftotext" | "pdfcpu" | "ocrmypdf">;
  icon: ToolIconName;
}> = [
  {
    title: "Edit PDF",
    description: "Add text, shapes, and annotations.",
    href: "/tools/edit-pdf",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "edit"
  },
  {
    title: "Merge PDF",
    description: "Combine PDFs in the order you choose.",
    href: "/tools/merge-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "merge"
  },
  {
    title: "Split PDF",
    description: "Separate pages into independent files.",
    href: "/tools/split-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "split"
  },
  {
    title: "Remove Pages",
    description: "Delete pages from a PDF.",
    href: "/tools/remove-pages",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "organize"
  },
  {
    title: "Extract Pages",
    description: "Export selected pages into a new PDF.",
    href: "/tools/extract-pages",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "organize"
  },
  {
    title: "Compress PDF",
    description: "Reduce file size without losing quality.",
    href: "/tools/compress-pdf",
    category: ["optimize"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "compress"
  },
  {
    title: "Repair PDF",
    description: "Fix broken PDFs and recover structure.",
    href: "/tools/repair-pdf",
    category: ["optimize"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "compress"
  },
  {
    title: "PDF to Word",
    description: "Export to editable DOCX format.",
    href: "/tools/pdf-to-word",
    category: ["convert"],
    badge: "Live",
    healthKey: ["pandoc", "pdftotext"],
    icon: "pdf-to-word"
  },
  {
    title: "PDF to Pages",
    description: "Convert PDFs into Apple Pages files (macOS only).",
    href: "/tools/pdf-to-pages",
    category: ["convert"],
    badge: "Live",
    icon: "pdf-to-word"
  },
  {
    title: "PDF to PowerPoint",
    description: "Convert slides into PPTX.",
    href: "/tools/pdf-to-ppt",
    category: ["convert"],
    badge: "Live",
    healthKey: ["libreoffice"],
    icon: "pdf-to-ppt"
  },
  {
    title: "PDF to Excel",
    description: "Extract tables into spreadsheets.",
    href: "/tools/pdf-to-excel",
    category: ["convert"],
    badge: "Live",
    healthKey: ["libreoffice"],
    icon: "pdf-to-excel"
  },
  {
    title: "Word to PDF",
    description: "Convert DOC/DOCX into a PDF.",
    href: "/tools/word-to-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["libreoffice"],
    icon: "word-to-pdf"
  },
  {
    title: "PowerPoint to PDF",
    description: "Export PPT/PPTX into PDF.",
    href: "/tools/ppt-to-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["libreoffice"],
    icon: "ppt-to-pdf"
  },
  {
    title: "Excel to PDF",
    description: "Convert XLS/XLSX into PDF.",
    href: "/tools/excel-to-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["libreoffice"],
    icon: "excel-to-pdf"
  },
  {
    title: "HTML to PDF",
    description: "Convert web pages into PDF.",
    href: "/tools/html-to-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["playwright"],
    icon: "word-to-pdf"
  },
  {
    title: "PDF to JPG",
    description: "Convert PDF pages to JPG.",
    href: "/tools/pdf-to-image",
    category: ["convert"],
    badge: "Live",
    icon: "pdf-to-jpg"
  },
  {
    title: "JPG to PDF",
    description: "Convert images to PDF.",
    href: "/tools/image-to-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "jpg-to-pdf"
  },
  {
    title: "Unlock PDF",
    description: "Remove password protection.",
    href: "/tools/unlock-pdf",
    category: ["security"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "unlock"
  },
  {
    title: "Protect PDF",
    description: "Encrypt and control access.",
    href: "/tools/protect-pdf",
    category: ["security"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "protect"
  },
  {
    title: "Organize PDF",
    description: "Reorder pages with precision.",
    href: "/tools/organize-pdf",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "organize"
  },
  {
    title: "Rotate PDF",
    description: "Rotate pages for correct orientation.",
    href: "/tools/rotate-pdf",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "organize"
  },
  {
    title: "Add Page Numbers",
    description: "Insert page numbers into a PDF.",
    href: "/tools/add-page-numbers",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "edit"
  },
  {
    title: "Add Watermark",
    description: "Stamp watermarks across pages.",
    href: "/tools/add-watermark",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "edit"
  },
  {
    title: "Sign PDF",
    description: "Add signature stamps with precision.",
    href: "/tools/sign-pdf",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "sign"
  },
  {
    title: "Crop PDF",
    description: "Trim margins and crop pages.",
    href: "/tools/crop-pdf",
    category: ["edit"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "crop"
  },
  {
    title: "Redact PDF",
    description: "Permanently remove sensitive content.",
    href: "/tools/redact-pdf",
    category: ["security"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "protect"
  },
  {
    title: "Compare PDF",
    description: "Diff two PDFs for changes.",
    href: "/tools/compare-pdf",
    category: ["security"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "protect"
  },
  {
    title: "Flatten PDF",
    description: "Lock annotations into the document.",
    href: "/tools/flatten-pdf",
    category: ["security"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "protect"
  },
  {
    title: "PDF to PDF/A",
    description: "Archive-ready PDF/A conversion.",
    href: "/tools/pdf-to-pdfa",
    category: ["convert"],
    badge: "Live",
    healthKey: ["ocrmypdf"],
    icon: "pdf-to-pdfa"
  },
  {
    title: "Scan to PDF",
    description: "Turn scans into clean PDFs.",
    href: "/tools/scan-to-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["pdfcpu"],
    icon: "scan"
  },
  {
    title: "OCR PDF",
    description: "Make PDFs searchable.",
    href: "/tools/ocr-pdf",
    category: ["convert"],
    badge: "Live",
    healthKey: ["ocrmypdf"],
    icon: "ocr"
  }
];

export default function PdfToolGrid() {
  const [active, setActive] = useState<Category>("all");
  const [health, setHealth] = useState<Record<string, boolean> | null>(null);
  const apiBase = useMemo(() => getApiBase(), []);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${apiBase}/health/tools`);
        if (!response.ok) return;
        const json = (await response.json()) as Record<string, boolean>;
        setHealth(json);
      } catch {
        setHealth(null);
      }
    };
    fetchHealth();
  }, [apiBase]);

  const visible = useMemo(() => {
    if (active === "all") return tools;
    return tools.filter((tool) => tool.category.includes(active));
  }, [active]);

  return (
    <div>
      {health && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-obsidian-500">
          <span className="text-[11px] uppercase tracking-[0.2em] text-obsidian-500">Tool Health</span>
          <span className={`tool-badge ${health.libreoffice ? "tool-badge--live" : "tool-badge--muted"}`}>
            {health.libreoffice && <span className="tool-badge__dot" />}
            LibreOffice
          </span>
          <span className={`tool-badge ${health.playwright ? "tool-badge--live" : "tool-badge--muted"}`}>
            {health.playwright && <span className="tool-badge__dot" />}
            Playwright
          </span>
          <span className={`tool-badge ${health.pandoc && health.pdftotext ? "tool-badge--live" : "tool-badge--muted"}`}>
            {health.pandoc && health.pdftotext && <span className="tool-badge__dot" />}
            PDF to Word
          </span>
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActive(filter.key)}
            aria-pressed={active === filter.key}
            className={`tool-filter ${active === filter.key ? "is-active" : ""}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((tool) => {
          let badge = tool.badge;
          if (tool.healthKey && health) {
            const ok = tool.healthKey.every((key) => Boolean(health[key]));
            badge = ok ? "Live" : "Coming";
          }
          return <ToolCard key={tool.href} {...tool} badge={badge} />;
        })}
      </div>
    </div>
  );
}
