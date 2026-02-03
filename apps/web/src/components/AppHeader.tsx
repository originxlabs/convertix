"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AppHeader() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );
  const [imageStatus, setImageStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );
  const [imagePulse, setImagePulse] = useState(0);
  const [imageCheckedAt, setImageCheckedAt] = useState<string>("");
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

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
    const checkImage = async () => {
      try {
        const response = await fetch(`${apiBase}/api/image/health`);
        if (!isMounted) return;
        const next = response.ok ? "online" : "offline";
        setImageStatus(next);
        setImagePulse((prev) => prev + 1);
        setImageCheckedAt(new Date().toLocaleTimeString());
      } catch {
        if (!isMounted) return;
        setImageStatus("offline");
        setImagePulse((prev) => prev + 1);
        setImageCheckedAt(new Date().toLocaleTimeString());
      }
    };
    void check();
    void checkImage();
    const timer = window.setInterval(check, 15000);
    const imageTimer = window.setInterval(checkImage, 15000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
      window.clearInterval(imageTimer);
    };
  }, [apiBase]);

  const handleClearCache = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("convertix-")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore storage errors
    }
    setCacheCleared(true);
    window.setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <header className="landing-nav">
      <div className="landing-nav__inner">
        <Link href="/" className="landing-nav__brand">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-900/10 bg-white">
            <Image
              src="/convertix-logo-dark.svg"
              alt="Convertix"
              width={18}
              height={18}
              className="h-4 w-4"
              priority
            />
          </span>
          <span className="landing-brand__text">CONVERTIX</span>
        </Link>

        <nav className="landing-nav__center">
          <Link href="/x-pdf" className="landing-link">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 3h8l4 4v14H6V3z M14 3v5h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            PDF Studio
          </Link>
          <Link href="/x-image" className="landing-link">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 13l3-3 5 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            Image Labs
          </Link>
          <Link href="/noteflowlm" className="landing-link">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 6h9a4 4 0 0 1 4 4v8H9a4 4 0 0 0-4 4V6z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M9 10h6M9 14h6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            NoteFlowLM
          </Link>
          <Link href="/pricing" className="landing-link">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7h10v10H7z" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M12 9v6M9.5 12h5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            Pricing
          </Link>
          <Link href="/docs" className="landing-link">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 0-2 2V4z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M9 8h6M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            Docs
          </Link>
        </nav>

        <div className="landing-nav__right">
          <button type="button" onClick={() => setShowClearModal(true)} className="landing-pill">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7h10M9 7v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7M10 7l1-2h2l1 2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            Clear Cache
          </button>
          <div className="landing-pill">
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
          <div className="landing-pill tooltip" key={`image-${imagePulse}`}>
            <span
              className={`api-status__dot ${
                imageStatus === "online"
                  ? "api-status__dot--online"
                  : imageStatus === "offline"
                    ? "api-status__dot--offline"
                    : "api-status__dot--checking"
              }`}
            />
            Image Engine {imageStatus}
            <div className="tooltip__bubble">
              <span>URL: {`${apiBase}/image-engine`}</span>
              <span>Last check: {imageCheckedAt || "checking..."}</span>
            </div>
          </div>
          <Link href="/signin" className="landing-link">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0z" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M4 20c1.6-3 4.4-5 8-5s6.4 2 8 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            Sign in
          </Link>
          <Link href="/get-started" className="landing-cta">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 12h10M13 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Get started →
          </Link>
        </div>
      </div>

      {cacheCleared && (
        <div className="landing-toast">Cache cleared for this browser session.</div>
      )}

      {showClearModal && (
        <div className="landing-modal">
          <div className="landing-modal__card">
            <div className="text-sm font-semibold text-ink-900">Clear Convertix Cache?</div>
            <div className="mt-2 text-xs text-obsidian-500">
              This removes locally stored Convertix editor data for this browser only. Your files are not uploaded.
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="landing-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClearCache();
                  setShowClearModal(false);
                }}
                className="landing-cta"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
