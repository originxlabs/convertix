import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function PricingPage() {
  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="landing-section fade-in">
        <div className="landing-section__header">
          <h2>Start free. Upgrade when you need power.</h2>
          <p>Transparent tiers built for teams that care about precision.</p>
        </div>
        <div className="hero-visual hero-visual--pricing" />
        <div className="landing-pricing">
          <div className="pricing-card">Free</div>
          <div className="pricing-card">Pro</div>
          <div className="pricing-card">Enterprise</div>
        </div>
        <div className="landing-hero__actions">
          <Link href="/get-started" className="landing-cta">
            Talk to sales
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
