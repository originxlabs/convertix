"use client";

import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function Home() {
  return (
    <main className="landing-shell">
      <AppHeader />

      <section className="landing-hero hero-reference">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-pill fade-in">
            <span className="hero-pill__icon" aria-hidden="true">✦</span>
            #1 AI-ready document & image platform
          </div>
          <h1 className="hero-title fade-in">CONVERTIX</h1>
          <p className="hero-subtitle fade-in">Ship-grade PDF and image ops with AI assistance, zero vendor lock-in, and enterprise trust.</p>
          <div className="hero-cta-row fade-in">
            <Link href="/get-started" className="hero-cta hero-cta--primary">
              Start free →
            </Link>
            <Link href="/get-started" className="hero-cta hero-cta--link">
              Download desktop
            </Link>
          </div>
          <div className="hero-marquee" aria-hidden="true">
            <div className="hero-marquee__track">
              {[
                "Merge PDF ↔️ JPG to PDF",
                "Compress PDF • 42% smaller",
                "OCR + Searchable PDFs",
                "Resize & Upscale Images",
                "Watermark & Protect",
                "Rotate, Split, Flatten",
                "NoteFlowLM: Ask any doc"
              ].map((item) => (
                <div key={`track-a-${item}`} className="hero-marquee__card">
                  {item}
                </div>
              ))}
            </div>
            <div className="hero-marquee__track hero-marquee__track--delayed">
              {[
                "Batch exports",
                "Desktop + Web sync",
                "Zero vendor lock-in",
                "Secure by default"
              ].map((item) => (
                <div key={`track-b-${item}`} className="hero-marquee__card">
                  {item}
                </div>
              ))}
            </div>
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
        </div>
        <div className="hero-device-stage">
          <div className="device-monitor">
            <div className="device-monitor__top">
              <span className="device-dot device-dot--red" />
              <span className="device-dot device-dot--yellow" />
              <span className="device-dot device-dot--green" />
              <span className="device-title">CONVERTIX Studio</span>
            </div>
            <div className="device-monitor__body">
              <div className="device-sidebar">
                <div className="device-file is-active">Invoice.pdf</div>
                <div className="device-file">Merge Pack.pdf</div>
                <div className="device-file">Report.docx</div>
              </div>
              <div className="device-canvas">
                <div className="device-screen">
                  <div className="screen-glow" />
                  <div className="screen-bar screen-bar--wide" />
                  <div className="screen-bar screen-bar--mid" />
                  <div className="screen-bar screen-bar--thin" />
                  <div className="screen-grid" />
                </div>
                <div className="device-preview">
                  <div className="device-preview__stack">
                    <span className="page-thumb page-thumb--active" />
                    <span className="page-thumb" />
                    <span className="page-thumb" />
                  </div>
                  <div className="device-card device-card--merge">
                    <div className="device-card__icon">📄</div>
                    <div className="device-card__title">Merge PDF</div>
                    <div className="device-card__meta">3 files • 24 pages</div>
                    <div className="device-card__progress">
                      <span />
                    </div>
                    <div className="device-card__status">Processing…</div>
                  </div>
                  <div className="device-card device-card--split">
                    <div className="device-card__icon">✂️</div>
                    <div className="device-card__title">Split PDF</div>
                    <div className="device-card__meta">8 pages exported</div>
                    <div className="device-card__progress">
                      <span />
                    </div>
                    <div className="device-card__status">Splitting…</div>
                  </div>
                  <div className="device-card device-card--compress">
                    <div className="device-card__icon">🗜️</div>
                    <div className="device-card__title">Compress PDF</div>
                    <div className="device-card__meta">42% smaller</div>
                    <div className="device-card__progress">
                      <span />
                    </div>
                    <div className="device-card__status">Compressing…</div>
                  </div>
                  <div className="device-preview__toolbar">
                    <span>Rotate</span>
                    <span>Split</span>
                    <span>Edit</span>
                  </div>
                </div>
              </div>
              <div className="device-tools">
                <div className="device-tool is-highlight">Merge</div>
                <div className="device-tool">Compress</div>
                <div className="device-tool">Split</div>
                <div className="device-tool">Protect</div>
              </div>
            </div>
            <div className="device-stand" />
          </div>
          <div className="device-phone">
            <div className="device-phone__notch" />
            <div className="device-phone__screen">
              <div className="screen-bar screen-bar--thin" />
              <div className="screen-bar screen-bar--mid" />
              <div className="screen-bar screen-bar--tiny" />
            </div>
            <div className="device-phone__card">
              <div className="device-card__icon">📄</div>
              <div className="device-card__title">Upload</div>
              <div className="device-card__meta">Analyzing…</div>
            </div>
            <div className="device-label">iPhone</div>
          </div>
          <div className="device-tablet">
            <div className="device-tablet__screen">
              <div className="screen-bar screen-bar--wide" />
              <div className="screen-bar screen-bar--mid" />
              <div className="screen-bar screen-bar--thin" />
            </div>
            <div className="device-tablet__card">
              <div className="device-card__icon">📄</div>
              <div className="device-card__title">Upload</div>
              <div className="device-card__meta">Analyzing…</div>
            </div>
            <div className="device-label">iPad Pro</div>
          </div>
        </div>
      </section>

      <section className="partner-strip" aria-label="Trusted partners">
        <div className="partner-strip__label">Trusted by modern teams</div>
        <div className="partner-marquee">
          <div className="partner-marquee__track">
            {["azure", "aws", "vercel", "stripe", "razorpay"].map((logo) => (
              <div key={`p-a-${logo}`} className="partner-chip">
                <img src={`/partners/${logo}.svg`} alt={`${logo} logo`} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="partner-marquee__track partner-marquee__track--delayed">
            {["stripe", "razorpay", "azure", "aws", "vercel"].map((logo) => (
              <div key={`p-b-${logo}`} className="partner-chip">
                <img src={`/partners/${logo}.svg`} alt={`${logo} logo`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <h2>Studios</h2>
          <p>Three products. One quiet standard of quality.</p>
        </div>
        <div className="landing-triad landing-triad--marketing">
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

      <section className="landing-section landing-section--accent">
        <div className="landing-section__header">
          <h2>Why Convertix ranks first</h2>
          <p>Built like infrastructure. Designed like a product. Tuned for SEO and AI agents.</p>
        </div>
        <div className="marketing-grid">
          {[
            { title: "Performance", body: "Sub-2s interactive loads with edge-cached assets.", meta: "Core Web Vitals tuned", icon: "⚡" },
            { title: "Control", body: "Tiered security, deterministic engines, audit-friendly logs.", meta: "Enterprise posture", icon: "🛡️" },
            { title: "Search visibility", body: "Semantic copy + blazing TTFB for crawlers and humans.", meta: "Sitemap + SSR", icon: "🔍" },
            { title: "AI-friendly", body: "Structured outputs ready for AI agents and RAG pipelines.", meta: "Embeddings-ready", icon: "🤖" },
            { title: "Design polish", body: "Premium UX inspired by iLovePDF and Stripe-level craft.", meta: "Microinteractions", icon: "✨" },
            { title: "Global scale", body: "Edge delivery, signed URLs, zero vendor lock-in.", meta: "Cloud-native", icon: "🌐" }
          ].map((item, idx) => (
            <div key={item.title} className="marketing-card fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="marketing-card__icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <span>{item.meta}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <h2>Technical confidence</h2>
          <p>Infra-grade guarantees with product-level polish.</p>
        </div>
        <div className="pill-grid">
          {[".NET Core backend", "Linux-first", "Cloud-native", "Pluggable AI", "Zero vendor lock-in", "Signed URLs", "Edge resizing"].map((item) => (
            <div key={item} className="pill-card">{item}</div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <h2>Use cases</h2>
          <p>Built for the real workflows you ship every day.</p>
        </div>
        <div className="usecase-grid">
          {[
            { title: "Teams handling sensitive documents", body: "Secure workflows that respect privacy without slowing delivery." },
            { title: "Creators managing assets at scale", body: "Clean conversion and optimization pipelines for modern content." },
            { title: "Professionals and researchers thinking with PDFs", body: "Query, analyze, and summarize knowledge inside your documents." }
          ].map((item, idx) => (
            <div key={item.title} className="usecase-card fade-up" style={{ animationDelay: `${idx * 80}ms` }}><div className="usecase-card__title">{item.title}</div><p>{item.body}</p></div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--pricing">
        <div className="landing-section__header">
          <h2>Start free. Upgrade when you need power.</h2>
          <p>Same pricing you see on the pricing page — kept in sync.</p>
        </div>
        <div className="pricing-preview">
          {[
            { id: "free", name: "Free", price: "₹0", cadence: "/ month", note: "For quick tasks & first-time users." },
            { id: "pro", name: "Pro", price: "₹199", cadence: "/ month", note: "₹1,999 / year (Save 20%). Built for daily productivity." },
            { id: "enterprise", name: "Enterprise", price: "₹999", cadence: "/ month per user", note: "₹9,999 / year per user. For teams & businesses." }
          ].map((plan, idx) => (
            <div key={plan.id} className="pricing-preview__card fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="pricing-preview__price">
                {plan.price} <span>{plan.cadence}</span>
              </div>
              <div className="pricing-preview__name">{plan.name}</div>
              <div className="pricing-preview__note">{plan.note}</div>
              <Link href={`/pricing#${plan.id}`} className="pricing-preview__cta">
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="landing-cta">
          View full pricing →
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
