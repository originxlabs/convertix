"use client";

import { useEffect, useMemo, useState } from "react";

import ToolCard from "@/components/ToolCard";
import type { ToolIconName } from "@/components/ToolIcon";
import { getApiBase } from "@/lib/apiBase";

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
  healthKey?: Array<"engine" | "playwright" | "removebg" | "upscale" | "blurface" | "meme">;
  icon: ToolIconName;
}> = [
  {
    title: "Compress Image",
    description: "Shrink JPG, PNG, SVG, and GIF without losing clarity.",
    href: "/tools/image-compress",
    category: ["optimize"],
    badge: "Live",
    healthKey: ["engine"],
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
    healthKey: ["engine"],
    icon: "crop"
  },
  {
    title: "Convert to JPG",
    description: "Turn PNG, SVG, TIFF, HEIC into JPG.",
    href: "/tools/image-convert-to-jpg",
    category: ["convert"],
    badge: "Coming",
    healthKey: ["engine"],
    icon: "img-convert-jpg"
  },
  {
    title: "Convert from JPG",
    description: "Convert JPG to PNG or GIF with quality controls.",
    href: "/tools/image-convert-from-jpg",
    category: ["convert"],
    badge: "Coming",
    healthKey: ["engine"],
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
    healthKey: ["engine", "upscale"],
    icon: "img-edit"
  },
  {
    title: "Remove Background",
    description: "Remove backgrounds with clean cutouts.",
    href: "/tools/image-remove-bg",
    category: ["edit"],
    badge: "Pro",
    healthKey: ["engine", "removebg"],
    icon: "img-edit"
  },
  {
    title: "Watermark Image",
    description: "Stamp text or logos on images.",
    href: "/tools/image-watermark",
    category: ["security"],
    badge: "Coming",
    healthKey: ["engine"],
    icon: "protect"
  },
  {
    title: "Meme Generator",
    description: "Create meme templates with captions.",
    href: "/tools/image-meme",
    category: ["create"],
    badge: "Pro",
    healthKey: ["engine", "meme"],
    icon: "img-edit"
  },
  {
    title: "Rotate Image",
    description: "Rotate images in batch with angles.",
    href: "/tools/image-rotate",
    category: ["edit"],
    badge: "Coming",
    healthKey: ["engine"],
    icon: "crop"
  },
  {
    title: "HTML to Image",
    description: "Render a URL into a JPG or PNG.",
    href: "/tools/html-to-image",
    category: ["convert"],
    badge: "New",
    healthKey: ["engine", "playwright"],
    icon: "img-convert-jpg"
  },
  {
    title: "Blur Face",
    description: "Blur faces or plates to protect privacy.",
    href: "/tools/image-blur-face",
    category: ["security"],
    badge: "Pro",
    healthKey: ["engine", "blurface"],
    icon: "protect"
  }
];

export default function ImageToolGrid() {
  const [active, setActive] = useState<Category>("all");
  const [health, setHealth] = useState<Record<string, boolean> | null>(null);
  const apiBase = useMemo(() => getApiBase(), []);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${apiBase}/api/image/health/tools`);
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
          <span className="text-[11px] uppercase tracking-[0.2em] text-obsidian-500">Image Health</span>
          <span className={`tool-badge ${health.engine ? "tool-badge--live" : "tool-badge--muted"}`}>
            {health.engine && <span className="tool-badge__dot" />}
            Image Engine
          </span>
          <span className={`tool-badge ${health.playwright ? "tool-badge--live" : "tool-badge--muted"}`}>
            {health.playwright && <span className="tool-badge__dot" />}
            Playwright
          </span>
          <span className={`tool-badge ${health.removebg && health.upscale && health.blurface ? "tool-badge--live" : "tool-badge--muted"}`}>
            {health.removebg && health.upscale && health.blurface && <span className="tool-badge__dot" />}
            AI Keys
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
            const ok = tool.healthKey.every((key) => {
              if (key === "engine") return Boolean(health.engine);
              if (key === "playwright") return Boolean(health.playwright);
              // If engine is live, mark AI tools live even if keys are missing.
              return Boolean(health.engine);
            });
            badge = ok ? "Live" : "Coming";
          }
          return <ToolCard key={tool.href} {...tool} badge={badge} />;
        })}
      </div>
    </div>
  );
}
