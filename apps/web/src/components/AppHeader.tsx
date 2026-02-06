"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ToolIcon, { type ToolIconName } from "@/components/ToolIcon";
import { getApiBase } from "@/lib/apiBase";
// theme toggle removed for light-only mode

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
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showPdfDrawer, setShowPdfDrawer] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);

  const pdfMenu: Array<{ title: string; items: Array<{ label: string; href: string; icon: ToolIconName }> }> = [
    {
      title: "Organize PDF",
      items: [
        { label: "Merge PDF", href: "/tools/merge-pdf", icon: "merge" },
        { label: "Split PDF", href: "/tools/split-pdf", icon: "split" },
        { label: "Organize PDF", href: "/tools/organize-pdf", icon: "organize" },
        { label: "Remove Pages", href: "/tools/remove-pages", icon: "organize" },
        { label: "Extract Pages", href: "/tools/extract-pages", icon: "organize" },
        { label: "Rotate PDF", href: "/tools/rotate-pdf", icon: "organize" }
      ]
    },
    {
      title: "Convert to PDF",
      items: [
        { label: "Word to PDF", href: "/tools/word-to-pdf", icon: "word-to-pdf" },
        { label: "PowerPoint to PDF", href: "/tools/ppt-to-pdf", icon: "ppt-to-pdf" },
        { label: "Excel to PDF", href: "/tools/excel-to-pdf", icon: "excel-to-pdf" },
        { label: "HTML to PDF", href: "/tools/html-to-pdf", icon: "word-to-pdf" },
        { label: "JPG to PDF", href: "/tools/image-to-pdf", icon: "jpg-to-pdf" },
        { label: "Scan to PDF", href: "/tools/scan-to-pdf", icon: "scan" }
      ]
    },
    {
      title: "Convert from PDF",
      items: [
        { label: "PDF to Word", href: "/tools/pdf-to-word", icon: "pdf-to-word" },
        { label: "PDF to Pages", href: "/tools/pdf-to-pages", icon: "pdf-to-word" },
        { label: "PDF to JPG", href: "/tools/pdf-to-image", icon: "pdf-to-jpg" },
        { label: "PDF to PPT", href: "/tools/pdf-to-ppt", icon: "pdf-to-ppt" },
        { label: "PDF to Excel", href: "/tools/pdf-to-excel", icon: "pdf-to-excel" },
        { label: "OCR PDF", href: "/tools/ocr-pdf", icon: "ocr" }
      ]
    },
    {
      title: "Edit PDF",
      items: [
        { label: "Edit PDF", href: "/tools/edit-pdf", icon: "edit" },
        { label: "Add Page Numbers", href: "/tools/add-page-numbers", icon: "edit" },
        { label: "Add Watermark", href: "/tools/add-watermark", icon: "edit" },
        { label: "Crop PDF", href: "/tools/crop-pdf", icon: "crop" },
        { label: "Sign PDF", href: "/tools/sign-pdf", icon: "sign" }
      ]
    },
    {
      title: "Optimize & Security",
      items: [
        { label: "Compress PDF", href: "/tools/compress-pdf", icon: "compress" },
        { label: "Repair PDF", href: "/tools/repair-pdf", icon: "compress" },
        { label: "PDF to PDF/A", href: "/tools/pdf-to-pdfa", icon: "pdf-to-pdfa" },
        { label: "Protect PDF", href: "/tools/protect-pdf", icon: "protect" },
        { label: "Unlock PDF", href: "/tools/unlock-pdf", icon: "unlock" },
        { label: "Redact PDF", href: "/tools/redact-pdf", icon: "protect" },
        { label: "Compare PDF", href: "/tools/compare-pdf", icon: "protect" },
        { label: "Flatten PDF", href: "/tools/flatten-pdf", icon: "protect" }
      ]
    }
  ];

  const imageMenu: Array<{ title: string; items: Array<{ label: string; href: string; icon: ToolIconName }> }> = [
    {
      title: "Optimize",
      items: [
        { label: "Compress Image", href: "/tools/image-compress", icon: "compress" },
        { label: "Upscale Image", href: "/tools/image-upscale", icon: "img-edit" }
      ]
    },
    {
      title: "Edit",
      items: [
        { label: "Resize Image", href: "/tools/image-resize", icon: "img-resize" },
        { label: "Photo Editor", href: "/tools/image-edit", icon: "img-edit" },
        { label: "Crop Image", href: "/tools/image-crop", icon: "crop" },
        { label: "Rotate Image", href: "/tools/image-rotate", icon: "crop" },
        { label: "Remove Background", href: "/tools/image-remove-bg", icon: "img-edit" }
      ]
    },
    {
      title: "Convert",
      items: [
        { label: "Convert to JPG", href: "/tools/image-convert-to-jpg", icon: "img-convert-jpg" },
        { label: "Convert from JPG", href: "/tools/image-convert-from-jpg", icon: "img-convert-from-jpg" },
        { label: "HTML to Image", href: "/tools/html-to-image", icon: "img-convert-jpg" }
      ]
    },
    {
      title: "Create & Security",
      items: [
        { label: "Meme Generator", href: "/tools/image-meme", icon: "img-edit" },
        { label: "Watermark Image", href: "/tools/image-watermark", icon: "protect" },
        { label: "Blur Face", href: "/tools/image-blur-face", icon: "protect" }
      ]
    }
  ];

  const apiBase = getApiBase();

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

  useEffect(() => {
    const syncAuth = () => {
      const token = window.localStorage.getItem("convertix-auth-token");
      setIsSignedIn(Boolean(token));
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("convertix-auth-expired", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("convertix-auth-expired", syncAuth);
    };
  }, []);

  const handleLogout = async () => {
    const token = window.localStorage.getItem("convertix-auth-token");
    if (token) {
      try {
        await fetch(`${apiBase}/api/session/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // ignore logout errors
      }
    }
    window.localStorage.removeItem("convertix-auth-token");
    window.localStorage.removeItem("convertix-user-id");
    setIsSignedIn(false);
  };

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
          <span className="logo-badge inline-flex h-8 w-8 items-center justify-center rounded-full border">
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
          <div
            className="nav-group"
            onMouseEnter={() => setShowPdfMenu(true)}
            onMouseLeave={() => setShowPdfMenu(false)}
          >
            <Link
              href="/x-pdf"
              className="landing-link landing-link--dropdown"
              onClick={() => setShowPdfMenu((prev) => !prev)}
            >
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
              <span className={`nav-status nav-status--${apiStatus}`}>
                <span className={`nav-status__dot nav-status__dot--${apiStatus}`} />
              </span>
            </Link>
            <div
              className={`nav-menu nav-menu--pdf ${showPdfMenu ? "nav-menu--open" : ""}`}
              onMouseEnter={() => setShowPdfMenu(true)}
              onMouseLeave={() => setShowPdfMenu(false)}
            >
              {pdfMenu.map((section) => (
                <div key={section.title} className="nav-menu__column">
                  <div className="nav-menu__title">{section.title}</div>
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="nav-menu__item"
                      onClick={() => setShowPdfMenu(false)}
                    >
                      <ToolIcon name={item.icon} className="nav-menu__icon" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div
            className="nav-group"
            onMouseEnter={() => setShowImageMenu(true)}
            onMouseLeave={() => setShowImageMenu(false)}
          >
            <Link
              href="/x-image"
              className="landing-link landing-link--dropdown"
              onClick={() => setShowImageMenu((prev) => !prev)}
            >
              <span className="nav-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 13l3-3 5 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              Image Labs
              <span className={`nav-status nav-status--${imageStatus}`}>
                <span className={`nav-status__dot nav-status__dot--${imageStatus}`} />
              </span>
            </Link>
            <div
              className={`nav-menu nav-menu--image ${showImageMenu ? "nav-menu--open" : ""}`}
              onMouseEnter={() => setShowImageMenu(true)}
              onMouseLeave={() => setShowImageMenu(false)}
            >
              {imageMenu.map((section) => (
                <div key={section.title} className="nav-menu__column">
                  <div className="nav-menu__title">{section.title}</div>
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="nav-menu__item"
                      onClick={() => setShowImageMenu(false)}
                    >
                      <ToolIcon name={item.icon} className="nav-menu__icon" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <Link href="/noteflowlm" className="landing-link landing-link--ai">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 5h7a4 4 0 0 1 4 4v9H9a3 3 0 0 0-3 3V5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9h5M9 13h5M14.5 6.5l1-2m1 2l2-1m-1 3l2 1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            NoteFlowLM
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
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="landing-link">
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <rect x="13" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <rect x="3" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <rect x="13" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
                Dashboard
              </Link>
              <button type="button" onClick={handleLogout} className="landing-link">
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 7v-2h10v14H10v-2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M4 12h10M10 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/signin" className="landing-link">
              <span className="nav-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0z" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M4 20c1.6-3 4.4-5 8-5s6.4 2 8 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              Sign in
            </Link>
          )}
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

          {showPdfDrawer && (
        <div className="nav-drawer">
          <div className="nav-drawer__panel">
            <div className="nav-drawer__header">
              <span>PDF Tools</span>
              <button type="button" onClick={() => setShowPdfDrawer(false)}>Close</button>
            </div>
            {pdfMenu.map((section) => (
              <div key={section.title} className="nav-drawer__section">
                <div className="nav-drawer__title">{section.title}</div>
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href} className="nav-drawer__item">
                    <ToolIcon name={item.icon} className="nav-menu__icon" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
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
