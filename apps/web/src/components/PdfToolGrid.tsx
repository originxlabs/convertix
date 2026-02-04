"use client";

import { useMemo, useState } from "react";

import ToolCard from "@/components/ToolCard";
import type { ToolIconName } from "@/components/ToolIcon";

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
  icon: ToolIconName;
}> = [
  {
    title: "Edit PDF",
    description: "Add text, shapes, and annotations.",
    href: "/tools/edit-pdf",
    category: ["edit"],
    badge: "Live",
    icon: "edit"
  },
  {
    title: "Merge PDF",
    description: "Combine PDFs in the order you choose.",
    href: "/tools/merge-pdf",
    category: ["convert"],
    badge: "Live",
    icon: "merge"
  },
  {
    title: "Split PDF",
    description: "Separate pages into independent files.",
    href: "/tools/split-pdf",
    category: ["convert"],
    badge: "Live",
    icon: "split"
  },
  {
    title: "Remove Pages",
    description: "Delete pages from a PDF.",
    href: "/tools/remove-pages",
    category: ["edit"],
    badge: "Coming",
    icon: "organize"
  },
  {
    title: "Extract Pages",
    description: "Export selected pages into a new PDF.",
    href: "/tools/extract-pages",
    category: ["edit"],
    badge: "Coming",
    icon: "organize"
  },
  {
    title: "Compress PDF",
    description: "Reduce file size without losing quality.",
    href: "/tools/compress-pdf",
    category: ["optimize"],
    badge: "Live",
    icon: "compress"
  },
  {
    title: "Repair PDF",
    description: "Fix broken PDFs and recover structure.",
    href: "/tools/repair-pdf",
    category: ["optimize"],
    badge: "Coming",
    icon: "compress"
  },
  {
    title: "PDF to Word",
    description: "Export to editable DOCX format.",
    href: "/tools/pdf-to-word",
    category: ["convert"],
    badge: "Live",
    icon: "pdf-to-word"
  },
  {
    title: "PDF to Pages",
    description: "Convert PDFs into Apple Pages files (macOS only).",
    href: "/tools/pdf-to-pages",
    category: ["convert"],
    badge: "Mac",
    icon: "pdf-to-word"
  },
  {
    title: "PDF to PowerPoint",
    description: "Convert slides into PPTX.",
    href: "/tools/pdf-to-ppt",
    category: ["convert"],
    icon: "pdf-to-ppt"
  },
  {
    title: "PDF to Excel",
    description: "Extract tables into spreadsheets.",
    href: "/tools/pdf-to-excel",
    category: ["convert"],
    icon: "pdf-to-excel"
  },
  {
    title: "Word to PDF",
    description: "Convert DOC/DOCX into a PDF.",
    href: "/tools/word-to-pdf",
    category: ["convert"],
    icon: "word-to-pdf"
  },
  {
    title: "PowerPoint to PDF",
    description: "Export PPT/PPTX into PDF.",
    href: "/tools/ppt-to-pdf",
    category: ["convert"],
    icon: "ppt-to-pdf"
  },
  {
    title: "Excel to PDF",
    description: "Convert XLS/XLSX into PDF.",
    href: "/tools/excel-to-pdf",
    category: ["convert"],
    icon: "excel-to-pdf"
  },
  {
    title: "HTML to PDF",
    description: "Convert web pages into PDF.",
    href: "/tools/html-to-pdf",
    category: ["convert"],
    badge: "Coming",
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
    icon: "jpg-to-pdf"
  },
  {
    title: "Unlock PDF",
    description: "Remove password protection.",
    href: "/tools/unlock-pdf",
    category: ["security"],
    badge: "Live",
    icon: "unlock"
  },
  {
    title: "Protect PDF",
    description: "Encrypt and control access.",
    href: "/tools/protect-pdf",
    category: ["security"],
    badge: "Live",
    icon: "protect"
  },
  {
    title: "Organize PDF",
    description: "Reorder pages with precision.",
    href: "/tools/organize-pdf",
    category: ["edit"],
    badge: "Live",
    icon: "organize"
  },
  {
    title: "Rotate PDF",
    description: "Rotate pages for correct orientation.",
    href: "/tools/rotate-pdf",
    category: ["edit"],
    badge: "Coming",
    icon: "organize"
  },
  {
    title: "Add Page Numbers",
    description: "Insert page numbers into a PDF.",
    href: "/tools/add-page-numbers",
    category: ["edit"],
    badge: "Coming",
    icon: "edit"
  },
  {
    title: "Add Watermark",
    description: "Stamp watermarks across pages.",
    href: "/tools/add-watermark",
    category: ["edit"],
    badge: "Coming",
    icon: "edit"
  },
  {
    title: "Sign PDF",
    description: "Add signature stamps with precision.",
    href: "/tools/sign-pdf",
    category: ["edit"],
    badge: "Live",
    icon: "sign"
  },
  {
    title: "Crop PDF",
    description: "Trim margins and crop pages.",
    href: "/tools/crop-pdf",
    category: ["edit"],
    badge: "Live",
    icon: "crop"
  },
  {
    title: "Redact PDF",
    description: "Permanently remove sensitive content.",
    href: "/tools/redact-pdf",
    category: ["security"],
    badge: "Coming",
    icon: "protect"
  },
  {
    title: "Compare PDF",
    description: "Diff two PDFs for changes.",
    href: "/tools/compare-pdf",
    category: ["security"],
    badge: "Coming",
    icon: "protect"
  },
  {
    title: "Flatten PDF",
    description: "Lock annotations into the document.",
    href: "/tools/flatten-pdf",
    category: ["security"],
    badge: "Coming",
    icon: "protect"
  },
  {
    title: "PDF to PDF/A",
    description: "Archive-ready PDF/A conversion.",
    href: "/tools/pdf-to-pdfa",
    category: ["convert"],
    icon: "pdf-to-pdfa"
  },
  {
    title: "Scan to PDF",
    description: "Turn scans into clean PDFs.",
    href: "/tools/scan-to-pdf",
    category: ["convert"],
    icon: "scan"
  },
  {
    title: "OCR PDF",
    description: "Make PDFs searchable.",
    href: "/tools/ocr-pdf",
    category: ["convert"],
    icon: "ocr"
  }
];

export default function PdfToolGrid() {
  const [active, setActive] = useState<Category>("all");

  const visible = useMemo(() => {
    if (active === "all") return tools;
    return tools.filter((tool) => tool.category.includes(active));
  }, [active]);

  return (
    <div>
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
        {visible.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </div>
  );
}
