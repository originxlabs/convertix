"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

type Mode = "login" | "register";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/users/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          orgId: mode === "register" ? orgId || undefined : undefined
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Unable to sign in.");
        return;
      }
      setStatus(`Success. User ID: ${payload.userId}`);
      window.localStorage.setItem("convertix-user-id", payload.userId);
      if (payload.token) {
        window.localStorage.setItem("convertix-auth-token", payload.token);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-obsidian-100 bg-white/90 p-6 text-left shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-950">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-xs font-semibold text-obsidian-500 hover:text-ink-900"
            >
              {mode === "login" ? "Need an account?" : "Have an account?"}
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-obsidian-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-obsidian-200 px-4 py-2 text-sm outline-none focus:border-ink-900"
                placeholder="you@originxlabs.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-obsidian-500">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-obsidian-200 px-4 py-2 text-sm outline-none focus:border-ink-900"
                placeholder="••••••••"
              />
            </div>
            {mode === "register" ? (
              <div>
                <label className="text-xs font-semibold text-obsidian-500">
                  Org ID (optional)
                </label>
                <input
                  type="text"
                  value={orgId}
                  onChange={(event) => setOrgId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-obsidian-200 px-4 py-2 text-sm outline-none focus:border-ink-900"
                  placeholder="org_001"
                />
              </div>
            ) : null}
            {error ? <div className="text-sm text-red-500">{error}</div> : null}
            {status ? <div className="text-sm text-green-600">{status}</div> : null}
            <button type="submit" className="landing-cta w-full" disabled={isSubmitting}>
              {isSubmitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
        <div className="landing-hero__actions">
          <Link href="/get-started" className="landing-ghost">
            Back to home
          </Link>
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
