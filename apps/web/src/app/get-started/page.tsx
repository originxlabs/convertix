import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function GetStartedPage() {
  const windowsVersion = process.env.NEXT_PUBLIC_DESKTOP_WINDOWS_VERSION ?? "v0.1.0";
  const macVersion = process.env.NEXT_PUBLIC_DESKTOP_MACOS_VERSION ?? "v0.1.0";

  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="landing-hero fade-in">
        <p className="landing-eyebrow">Get started</p>
        <h1 className="landing-headline">Launch your CONVERTIX workspace.</h1>
        <p className="landing-subhead">
          Start free, then unlock Pro or Enterprise capabilities when you need scale and AI.
        </p>
        <div className="hero-visual" />
        <div className="landing-hero__downloads">
          <div className="download-chip">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h8v8H3V4zm10 0h8v8h-8V4zM3 14h8v6H3v-6zm10 0h8v6h-8v-6z" fill="currentColor" />
            </svg>
            Windows {windowsVersion}
          </div>
          <div className="download-chip">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M16.7 6.2c-1.1 0-2.3.7-3 1.7-.6.8-1.1 2-1 3.1 1.1.1 2.3-.6 3-1.6.6-.9 1-2.1 1-3.2zm3.1 6.3c-.1-2.5 2-3.7 2-3.8-1.1-1.6-2.7-1.8-3.3-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.7 2.9-.4 7.3 1.2 9.6.8 1.1 1.8 2.4 3 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.7-2.2.9-1.3 1.3-2.6 1.3-2.6-.1 0-2.4-.9-2.5-3.8z"
                fill="currentColor"
              />
            </svg>
            macOS {macVersion}
          </div>
        </div>
        <div className="landing-hero__actions">
          <Link href="/pricing" className="landing-cta">
            View pricing
          </Link>
          <Link href="/docs" className="landing-ghost">
            Read the docs
          </Link>
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
