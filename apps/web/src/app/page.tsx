"use client";

import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function Home() {
  return (
    <main className="landing-shell">
      <AppHeader />

      <section className="landing-hero">
        <p className="landing-eyebrow fade-in">Studio-grade infrastructure</p>
        <h1 className="landing-headline fade-in">
          Transform documents.
          <br />
          Images.
          <br />
          And knowledge.
        </h1>
        <p className="landing-subhead fade-in">
          CONVERTIX is a studio-grade platform for PDFs, images, and AI-powered notes — built for professionals.
        </p>
        <div className="landing-hero__status fade-in">
          <span className="landing-pill">Image Engine status is available in the header.</span>
        </div>
        <div className="landing-hero__actions fade-in">
          <Link href="/get-started" className="landing-cta">
            Get started free
          </Link>
          <Link href="/studios" className="landing-ghost">
            View studios →
          </Link>
        </div>
        <div className="landing-hero__downloads fade-in">
          <Link href="/get-started" className="download-chip" aria-label="Download for Windows">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h8v8H3V4zm10 0h8v8h-8V4zM3 14h8v6H3v-6zm10 0h8v6h-8v-6z" fill="currentColor" />
            </svg>
            Download for Windows
          </Link>
          <Link href="/get-started" className="download-chip" aria-label="Download for macOS (Apple Silicon)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M16.7 6.2c-1.1 0-2.3.7-3 1.7-.6.8-1.1 2-1 3.1 1.1.1 2.3-.6 3-1.6.6-.9 1-2.1 1-3.2zm3.1 6.3c-.1-2.5 2-3.7 2-3.8-1.1-1.6-2.7-1.8-3.3-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.7 2.9-.4 7.3 1.2 9.6.8 1.1 1.8 2.4 3 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.7-2.2.9-1.3 1.3-2.6 1.3-2.6-.1 0-2.4-.9-2.5-3.8z"
                fill="currentColor"
              />
            </svg>
            Download for macOS
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
