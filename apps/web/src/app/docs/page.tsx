import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function DocsPage() {
  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="landing-section fade-in">
        <div className="landing-section__header">
          <h2>Developer documentation</h2>
          <p>API-first, clear, and predictable. Built for engineering teams.</p>
        </div>
        <div className="hero-visual hero-visual--docs" />
        <div className="landing-columns">
          <div>
            <h4>API reference</h4>
            <p>PDF and Image endpoints, auth, and tier gating.</p>
          </div>
          <div>
            <h4>Guides</h4>
            <p>Workflows for merging, conversion, and AI pipelines.</p>
          </div>
          <div>
            <h4>SDKs</h4>
            <p>Client integrations for web and backend services.</p>
          </div>
        </div>
        <div className="landing-hero__actions">
          <Link href="/get-started" className="landing-cta">
            Get started
          </Link>
          <Link href="/" className="landing-ghost">
            Back to home
          </Link>
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
