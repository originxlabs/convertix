"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    cadence: "/ month",
    tagline: "For quick tasks & first-time users.",
    features: [
      "PDF merge, split, compress",
      "Image to PDF",
      "Basic image tools",
      "Up to 10MB files",
      "10 operations per day",
      "Watermark: Powered by Convertix",
      "Public links expire in 24 hrs"
    ],
    missing: ["OCR", "AI image tools", "Password protection", "Priority processing"],
    cta: "Start Free"
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹199",
    cadence: "/ month",
    note: "₹1,999 / year (Save 20%)",
    tagline: "Built for daily productivity.",
    features: [
      "Everything in Free",
      "No watermark",
      "Up to 100MB files",
      "Unlimited conversions",
      "Batch processing (10 files)",
      "PDF lock/unlock, rotate, reorder",
      "PDF → Word / PNG / JPG",
      "API access (1,000 calls/month)",
      "Faster processing queue",
      "Files stored for 7 days"
    ],
    missing: ["Advanced OCR", "AI image tools", "Team features"],
    cta: "Upgrade to Pro",
    highlight: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹999",
    cadence: "/ month per user",
    note: "₹9,999 / year per user",
    tagline: "For teams & businesses.",
    features: [
      "Everything in Pro",
      "OCR (scanned PDFs → text)",
      "PDF signing & redaction",
      "Advanced compression",
      "AI image tools (remove bg, blur, upscale)",
      "Unlimited files & pages",
      "Team & org accounts",
      "Usage analytics + webhooks",
      "Priority infra + SLA-ready",
      "Email support"
    ],
    missing: ["On-prem / VNet", "Custom branding", "Dedicated support"],
    cta: "Contact Sales"
  }
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const trialEndsOn = useMemo(() => "May 4, 2026", []);

  useEffect(() => {
    if (selectedPlan) {
      window.localStorage.setItem("convertix-selected-plan", selectedPlan);
    }
  }, [selectedPlan]);

  const handleSelect = (planId: string) => {
    const token = window.localStorage.getItem("convertix-auth-token");
    setSelectedPlan(planId);
    if (!token) {
      window.location.href = "/signin";
      return;
    }
    window.alert("Plan selected. Payment will be enabled after the free trial.");
  };

  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="pricing-hero fade-in">
        <div className="pricing-header">
          <p className="pricing-eyebrow">Simple, transparent pricing</p>
          <h1>Convert PDFs & Images. Fast. Simple. Affordable.</h1>
          <p>
            Everything you need to work with PDFs and images — without expensive subscriptions.
            Free access for everyone until {trialEndsOn}. No credit card required.
          </p>
          <div className="pricing-cta-row">
            <button className="pricing-cta" onClick={() => handleSelect("free")}>
              Get Started Free
            </button>
            <button className="pricing-cta pricing-cta--ghost" onClick={() => handleSelect("pro")}>
              Upgrade to Pro
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.id} className={`pricing-card ${plan.highlight ? "pricing-card--highlight" : ""}`}>
              {plan.highlight && <div className="pricing-card__badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <p className="pricing-card__tagline">{plan.tagline}</p>
              <div className="pricing-card__price">
                <span>{plan.price}</span>
                <span className="pricing-card__cadence">{plan.cadence}</span>
              </div>
              {plan.note && <div className="pricing-card__note">{plan.note}</div>}
              <ul>
                {plan.features.map((item) => (
                  <li key={item}>✔ {item}</li>
                ))}
              </ul>
              {plan.missing.length > 0 && (
                <div className="pricing-card__missing">
                  {plan.missing.map((item) => (
                    <div key={item}>✖ {item}</div>
                  ))}
                </div>
              )}
              <button className="pricing-card__cta" onClick={() => handleSelect(plan.id)}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-trust">
          <span>No credit card required. Cancel anytime. Built for India 🇮🇳</span>
        </div>

        <div className="pricing-table">
          <div className="pricing-table__row pricing-table__head">
            <div>Feature</div>
            <div>Free</div>
            <div>Pro</div>
            <div>Enterprise</div>
          </div>
          {[
            ["Max file size", "10 MB", "100 MB", "1 GB"],
            ["Max pages", "20", "200", "Unlimited"],
            ["Batch processing", "No", "Up to 10 files", "Large batch jobs"],
            ["OCR", "No", "No", "Yes"],
            ["AI image tools", "No", "No", "Yes"],
            ["API access", "No", "1,000 calls/month", "Unlimited / negotiated"],
            ["Watermark", "Yes", "No", "No"],
            ["Team & org accounts", "No", "No", "Yes"]
          ].map((row) => (
            <div key={row[0]} className="pricing-table__row">
              {row.map((cell) => (
                <div key={cell}>{cell}</div>
              ))}
            </div>
          ))}
        </div>

        <div className="pricing-footer">
          <Link href="/docs" className="pricing-link">Read the docs</Link>
          <Link href="/status" className="pricing-link">Status</Link>
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
