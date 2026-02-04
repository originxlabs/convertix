"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import ToolIcon, { type ToolIconName } from "@/components/ToolIcon";

type ToolCardProps = {
  title: string;
  description: string;
  href: string;
  badge?: string;
  category?: string[];
  icon: ToolIconName;
};

export default function ToolCard({
  title,
  description,
  href,
  badge,
  icon
}: ToolCardProps) {
  return (
    <Link href={href} className="block">
      <motion.div
        className="tool-card p-6"
        data-tool-card
        whileHover={{ y: -1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <ToolIcon name={icon} />
            <div>
              <h3 className="text-lg font-semibold text-ink-950">{title}</h3>
              <p className="mt-2 text-sm text-obsidian-500">{description}</p>
            </div>
          </div>
          {badge ? (
            <span
              className={`tool-badge ${badge.toLowerCase() === "live" ? "tool-badge--live" : "tool-badge--muted"}`}
            >
              {badge.toLowerCase() === "live" && <span className="tool-badge__dot" />}
              {badge}
            </span>
          ) : null}
        </div>
      </motion.div>
    </Link>
  );
}
