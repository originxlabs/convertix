import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function SignInPage() {
  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="landing-hero fade-in">
        <p className="landing-eyebrow">Secure access</p>
        <h1 className="landing-headline">Sign in to CONVERTIX.</h1>
        <p className="landing-subhead">
          Use your team credentials to access PDF Studio, Image Labs, and NoteFlowLM.
        </p>
        <div className="hero-visual" />
        <div className="landing-hero__actions">
          <Link href="/get-started" className="landing-cta">
            Continue with email
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
