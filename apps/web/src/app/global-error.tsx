"use client";

import Link from "next/link";

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en">
      <body>
        <main className="landing-shell">
          <section className="landing-hero">
            <p className="landing-eyebrow">System error</p>
            <h1 className="landing-headline">Convertix needs a quick refresh.</h1>
            <p className="landing-subhead">
              Something failed to load. Please refresh the page or return home.
            </p>
            <div className="landing-hero__actions">
              <Link href="/" className="landing-cta">
                Back to home
              </Link>
            </div>
            {error?.digest ? (
              <p className="mt-6 text-xs text-obsidian-500">Error ID: {error.digest}</p>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  );
}
