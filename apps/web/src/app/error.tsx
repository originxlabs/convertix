"use client";

import Link from "next/link";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <p className="landing-eyebrow">Something went wrong</p>
        <h1 className="landing-headline">We hit an unexpected error.</h1>
        <p className="landing-subhead">
          Try again or return to the home page. If this persists, please refresh.
        </p>
        <div className="landing-hero__actions">
          <button type="button" onClick={() => reset()} className="landing-cta">
            Try again
          </button>
          <Link href="/" className="landing-ghost">
            Back to home
          </Link>
        </div>
        {error?.digest ? (
          <p className="mt-6 text-xs text-obsidian-500">Error ID: {error.digest}</p>
        ) : null}
      </section>
    </main>
  );
}
