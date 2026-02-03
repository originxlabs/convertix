"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AppHeader() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

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
    <header className="sticky top-0 z-20 w-full border-b border-obsidian-200/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-2xl bg-ink-900/5">
            <Image
              src="/convertix-logo-dark.svg"
              alt="Convertix logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
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
        <div className="hidden items-center gap-3 text-sm text-obsidian-500 md:flex">
          <span>Premium conversion suite</span>
          <span className="h-1 w-1 rounded-full bg-obsidian-300" />
          <span>Local-first exports</span>
        </div>
        <div className="api-status ml-4 hidden items-center gap-2 text-xs font-semibold text-obsidian-500 md:flex">
          <span
            className={`api-status__dot ${
              apiStatus === "online"
                ? "api-status__dot--online"
                : apiStatus === "offline"
                  ? "api-status__dot--offline"
                  : "api-status__dot--checking"
            }`}
          />
          API {apiStatus}
        </div>
      </div>
    </header>
  );
}
