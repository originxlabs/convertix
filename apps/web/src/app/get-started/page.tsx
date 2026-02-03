import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function GetStartedPage() {
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
