"use client";

import Image from "next/image";
import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="border-t border-obsidian-200/70 bg-white/70 py-8 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-2xl bg-ink-900/5">
            <Image
              src="/convertix-logo-dark.svg"
              alt="Convertix logo"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-obsidian-500">
              CONVERTIX
            </div>
            <div className="text-sm font-medium text-ink-900">
              by ORIGINX LABS | OriginX Studio
            </div>
          </div>
        </Link>
        <div className="text-xs text-obsidian-500">
          Premium conversion suite • Local-first exports
        </div>
      </div>
    </footer>
  );
}
