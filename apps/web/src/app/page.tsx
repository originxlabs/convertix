"use client";

import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function Home() {
  return (
    <main className="landing-shell">
      <AppHeader />

      <section className="landing-hero">
        <p className="landing-eyebrow">Studio-grade infrastructure</p>
        <h1 className="landing-headline">
          Transform documents.
          <br />
          Images.
          <br />
          And knowledge.
        </h1>
        <p className="landing-subhead">
          CONVERTIX is a studio-grade platform for PDFs, images, and AI-powered notes — built for professionals.
        </p>
        <div className="landing-hero__status">
          <span className="landing-pill">Image Engine status is available in the header.</span>
        </div>
        <div className="landing-hero__actions">
          <Link href="/get-started" className="landing-cta">
            Get started free
          </Link>
          <Link href="/studios" className="landing-ghost">
            View studios →
          </Link>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <h2>Studios</h2>
          <p>Three products. One quiet standard of quality.</p>
        </div>
        <div className="landing-triad">
          <div className="studio-card">
            <h3>PDF Studio</h3>
            <p>Professional-grade PDF workflows.</p>
            <div className="studio-card__meta">Edit, merge, sign, redact</div>
            <div className="studio-card__meta">Adobe-level precision</div>
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
            <div className="studio-card__meta">Compress, convert, enhance</div>
            <div className="studio-card__meta">AI when you need it</div>
            <Link href="/x-image" className="studio-card__cta">
              Open Image Labs →
            </Link>
          </div>
          <div className="studio-card">
            <h3>NoteFlowLM</h3>
            <p>Think with your documents.</p>
            <div className="studio-card__meta">Notebook-style AI</div>
            <div className="studio-card__meta">Ask questions, generate insights</div>
            <Link href="/noteflowlm" className="studio-card__cta">
              Open NoteFlowLM →
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <h2>Built like infrastructure. Designed like a product.</h2>
        </div>
        <div className="landing-columns">
          <div>
            <h4>Precision</h4>
            <p>Deterministic engines and predictable outputs, every time.</p>
          </div>
          <div>
            <h4>Control</h4>
            <p>Tier-based capabilities with enterprise-grade security.</p>
          </div>
          <div>
            <h4>Intelligence</h4>
            <p>AI where it adds value, never mandatory.</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <h2>Technical confidence</h2>
        </div>
        <div className="landing-chips">
          <span>.NET Core backend</span>
          <span>Linux-first</span>
          <span>Cloud-native</span>
          <span>Pluggable AI</span>
          <span>Zero vendor lock-in</span>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <h2>Use cases</h2>
        </div>
        <div className="landing-columns">
          <div>
            <h4>Teams handling sensitive documents</h4>
            <p>Secure workflows that respect privacy without slowing delivery.</p>
          </div>
          <div>
            <h4>Creators managing assets at scale</h4>
            <p>Clean conversion and optimization pipelines for modern content.</p>
          </div>
          <div>
            <h4>Professionals and researchers thinking with PDFs</h4>
            <p>Query, analyze, and summarize knowledge inside your documents.</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <h2>Start free. Upgrade when you need power.</h2>
        </div>
        <div className="landing-pricing">
          <div className="pricing-card">Free</div>
          <div className="pricing-card">Pro</div>
          <div className="pricing-card">Enterprise</div>
        </div>
        <Link href="/pricing" className="landing-ghost">
          View pricing →
        </Link>
      </section>

      <section className="landing-final">
        <h2>Your documents deserve better tools.</h2>
        <div className="landing-hero__actions">
          <Link href="/get-started" className="landing-cta">
            Get started
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
