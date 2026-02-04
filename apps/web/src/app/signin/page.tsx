"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import { getApiBase } from "@/lib/apiBase";

type Mode = "login" | "register";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [strength, setStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; orgId?: string }>({});

  const apiBase = getApiBase();

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (score >= 4) return "strong";
    if (score >= 3) return "good";
    if (score >= 2) return "weak";
    return "very-weak";
  }, [password]);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let next = "";
    for (let i = 0; i < 14; i += 1) {
      next += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(next);
    setStrength("Generated a strong password.");
  };

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setStrength("");
    setFieldErrors({});
    if (!validateEmail(email)) {
      setFieldErrors({ email: "Please enter a valid email address." });
      setError("Please fix the highlighted fields.");
      return;
    }
    if (password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters." });
      setError("Please fix the highlighted fields.");
      return;
    }
    if (mode === "register" && passwordStrength === "very-weak") {
      setFieldErrors({ password: "Password is too weak. Add numbers, symbols, and uppercase letters." });
      setError("Please fix the highlighted fields.");
      return;
    }
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
      try {
        const sessionResponse = await fetch(`${apiBase}/api/session`, {
          method: "POST",
          headers: payload.token ? { Authorization: `Bearer ${payload.token}` } : undefined
        });
        const sessionPayload = await sessionResponse.json().catch(() => ({}));
        if (sessionPayload?.sessionId) {
          window.localStorage.setItem("convertix-session-id", sessionPayload.sessionId);
        }
      } catch {
        // ignore session logging errors for now
      }
      const pendingPlan = window.localStorage.getItem("convertix-selected-plan");
      if (pendingPlan) {
        window.location.href = `/dashboard?plan=${pendingPlan}`;
        return;
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
      <section className="signin-shell fade-in">
        <div className="signin-card">
          <div className="signin-illustration">
            <div className="signin-illustration__frame">
              <div className="signin-illustration__top">
                <span className="signin-dot signin-dot--red" />
                <span className="signin-dot signin-dot--yellow" />
                <span className="signin-dot signin-dot--green" />
                <span className="signin-illustration__tab">Your Workspace</span>
              </div>
              <div className="signin-illustration__list">
                {[
                  { name: "Report.pdf", status: "Converted" },
                  { name: "Banner.png", status: "Optimized" },
                  { name: "Invoice.docx", status: "Processing" }
                ].map((item) => (
                  <div key={item.name} className="signin-illustration__row">
                    <div className="signin-illustration__icon" />
                    <div>
                      <div className="signin-illustration__name">{item.name}</div>
                      <div className="signin-illustration__status">{item.status}</div>
                    </div>
                    <span className="signin-illustration__badge" />
                  </div>
                ))}
              </div>
              <div className="signin-illustration__footer">
                <span>History</span>
                <div className="signin-illustration__progress">
                  <span />
                </div>
                <span>3 versions</span>
              </div>
            </div>
          </div>

          <div className="signin-panel">
            <p className="signin-eyebrow">Welcome back</p>
            <h1 className="signin-title">Sign in to access your workspace</h1>
            <button type="button" className="signin-google">
              <span className="signin-google__icon">G</span>
              Continue with Google
            </button>
            <div className="signin-divider">
              <span>OR CONTINUE WITH EMAIL</span>
            </div>

            <form onSubmit={handleSubmit} className="signin-form">
              <label>
                Email
                <div className="signin-input">
                  <span className="signin-input__icon">@</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className={`email-indicator ${validateEmail(email) ? "email-indicator--ok" : "email-indicator--pending"}`}>
                  {email.length === 0 ? "Awaiting email" : validateEmail(email) ? "Email looks good" : "Invalid email"}
                </div>
                {fieldErrors.email ? <div className="field-error">{fieldErrors.email}</div> : null}
              </label>
              <label>
                Password
                <div className="signin-input">
                  <span className="signin-input__icon">●</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      {showPassword && (
                        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.5" />
                      )}
                    </svg>
                  </button>
                </div>
                {password.length > 0 && (
                  <>
                    <div className={`password-meter password-meter--${passwordStrength}`}>
                      <span />
                    </div>
                    <div className="password-hint">
                      Strength: {passwordStrength.replace("-", " ")}
                    </div>
                  </>
                )}
                <button type="button" className="password-generate" onClick={generatePassword}>
                  Generate strong password
                </button>
                {fieldErrors.password ? <div className="field-error">{fieldErrors.password}</div> : null}
              </label>
              {mode === "register" ? (
                <label>
                  Org ID (optional)
                  <div className="signin-input">
                    <span className="signin-input__icon">#</span>
                    <input
                      type="text"
                      value={orgId}
                      onChange={(event) => setOrgId(event.target.value)}
                      placeholder="org_001"
                    />
                  </div>
                </label>
              ) : null}

              {strength ? <div className="signin-message signin-message--ok">{strength}</div> : null}
              {error ? <div className="signin-message signin-message--error">{error}</div> : null}
              {status ? <div className="signin-message signin-message--ok">{status}</div> : null}

              <button type="submit" className="signin-submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create account"}
                <span className="signin-submit__arrow">→</span>
              </button>
            </form>

            <div className="signin-footer">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Don't have an account? Create one" : "Have an account? Sign in"}
              </button>
              <Link href="/get-started">Continue without signing in</Link>
            </div>
          </div>
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
