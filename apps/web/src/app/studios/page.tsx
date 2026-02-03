import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function StudiosPage() {
  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="landing-section fade-in">
        <div className="landing-section__header">
          <h2>Studios</h2>
          <p>Three products designed for professional workflows.</p>
        </div>
        <div className="hero-visual hero-visual--studios" />
        <div className="landing-triad">
          <div className="studio-card">
            <h3>PDF Studio</h3>
            <p>Professional-grade PDF workflows.</p>
            <Link href="/x-pdf" className="studio-card__cta">
              Open PDF Studio →
            </Link>
          </div>
          <div className="studio-card">
            <div className="studio-card__title">
              <h3>Image Labs</h3>
              <span className="pro-badge">Pro tier</span>
            </div>
            <p>Production-ready image transformations.</p>
            <Link href="/x-image" className="studio-card__cta">
              Open Image Labs →
            </Link>
          </div>
          <div className="studio-card">
            <h3>NoteFlowLM</h3>
            <p>Think with your documents.</p>
            <Link href="/noteflowlm" className="studio-card__cta">
              Open NoteFlowLM →
            </Link>
          </div>
        </div>
        <div className="landing-hero__actions">
          <Link href="/" className="landing-ghost">
            Back to home
          </Link>
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
