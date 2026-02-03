"use client";

import { useMemo, useState } from "react";

import ToolCard from "@/components/ToolCard";
import type { ToolIconName } from "@/components/ToolIcon";

type Category = "all" | "optimize" | "create" | "edit" | "convert" | "security";

const filters: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "optimize", label: "Optimize" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "convert", label: "Convert" },
  { key: "security", label: "Security" }
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
    title: "Compress Image",
    description: "Shrink JPG, PNG, SVG, and GIF without losing clarity.",
    href: "/tools/image-compress",
    category: ["optimize"],
    badge: "Live",
    icon: "compress"
  },
  {
    title: "Resize Image",
    description: "Resize by pixels or percent with aspect lock.",
    href: "/tools/image-resize",
    category: ["edit"],
    badge: "Live",
    icon: "img-resize"
  },
  {
    title: "Crop Image",
    description: "Crop JPG, PNG, or GIF with precision.",
    href: "/tools/image-crop",
    category: ["edit"],
    badge: "Coming",
    icon: "crop"
  },
  {
    title: "Convert to JPG",
    description: "Turn PNG, SVG, TIFF, HEIC into JPG.",
    href: "/tools/image-convert-to-jpg",
    category: ["convert"],
    badge: "Coming",
    icon: "img-convert-jpg"
  },
  {
    title: "Convert from JPG",
    description: "Convert JPG to PNG or GIF with quality controls.",
    href: "/tools/image-convert-from-jpg",
    category: ["convert"],
    badge: "Coming",
    icon: "img-convert-from-jpg"
  },
  {
    title: "Photo Editor",
    description: "Adjust brightness, contrast, and tone.",
    href: "/tools/image-edit",
    category: ["edit"],
    badge: "Live",
    icon: "img-edit"
  },
  {
    title: "Upscale Image",
    description: "Increase resolution while retaining details.",
    href: "/tools/image-upscale",
    category: ["optimize"],
    badge: "Pro",
    icon: "img-edit"
  },
  {
    title: "Remove Background",
    description: "Remove backgrounds with clean cutouts.",
    href: "/tools/image-remove-bg",
    category: ["edit"],
    badge: "Pro",
    icon: "img-edit"
  },
  {
    title: "Watermark Image",
    description: "Stamp text or logos on images.",
    href: "/tools/image-watermark",
    category: ["security"],
    badge: "Coming",
    icon: "protect"
  },
  {
    title: "Meme Generator",
    description: "Create meme templates with captions.",
    href: "/tools/image-meme",
    category: ["create"],
    badge: "Pro",
    icon: "img-edit"
  },
  {
    title: "Rotate Image",
    description: "Rotate images in batch with angles.",
    href: "/tools/image-rotate",
    category: ["edit"],
    badge: "Coming",
    icon: "crop"
  },
  {
    title: "HTML to Image",
    description: "Render a URL into a JPG or PNG.",
    href: "/tools/html-to-image",
    category: ["convert"],
    badge: "New",
    icon: "img-convert-jpg"
  },
  {
    title: "Blur Face",
    description: "Blur faces or plates to protect privacy.",
    href: "/tools/image-blur-face",
    category: ["security"],
    badge: "Pro",
    icon: "protect"
  }
];

export default function ImageToolGrid() {
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
