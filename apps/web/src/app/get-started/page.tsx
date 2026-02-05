"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import { getApiBase } from "@/lib/apiBase";

export default function GetStartedPage() {
  const windowsVersion = process.env.NEXT_PUBLIC_DESKTOP_WINDOWS_VERSION ?? "v0.1.0";
  const macVersion = process.env.NEXT_PUBLIC_DESKTOP_MACOS_VERSION ?? "v0.1.0";
  const apiBase = getApiBase();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let next = "";
    for (let i = 0; i < 14; i += 1) {
      next += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(next);
    setStatus("Generated a strong password.");
  };

  const handleRegister = async () => {
    setError(null);
    setStatus(null);
    setFieldErrors({});
    if (!name.trim()) {
      setFieldErrors({ name: "Please enter your name." });
      setError("Please fix the highlighted fields.");
      return;
    }
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
    if (passwordStrength === "very-weak") {
      setFieldErrors({ password: "Password is too weak. Add numbers, symbols, and uppercase letters." });
      setError("Please fix the highlighted fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, orgId: orgId || undefined })
      });
      const payload = await response.json().catch(() => ({}));
      const finalizeAuth = (authPayload: { userId?: string; token?: string }, message: string) => {
        if (!authPayload?.userId) {
          setError("Unable to sign in. Please try again.");
          return;
        }
        window.localStorage.setItem("convertix-user-id", authPayload.userId);
        if (authPayload.token) {
          window.localStorage.setItem("convertix-auth-token", authPayload.token);
        }
        setStatus(message);
        window.location.href = "/dashboard";
      };

      if (!response.ok) {
        if (response.status === 409) {
          const loginRes = await fetch(`${apiBase}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          const loginPayload = await loginRes.json().catch(() => ({}));
          if (!loginRes.ok) {
            setError(loginPayload?.error ?? "Account exists but sign in failed.");
            return;
          }
          finalizeAuth(loginPayload, "Account already exists. Redirecting to dashboard…");
          return;
        }
        setError(payload?.error ?? "Unable to create account.");
        return;
      }
      finalizeAuth(payload, "Account created. Redirecting to dashboard…");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="register-shell fade-in">
        <div className="register-grid">
          <div className="register-copy">
            <p className="register-eyebrow">Get started</p>
            <h1 className="register-title">Launch your CONVERTIX workspace.</h1>
            <p className="register-subtitle">
              Create your account in seconds and unlock PDF Studio + Image Labs on every device.
            </p>
            <div className="register-badges">
              <span>Windows {windowsVersion}</span>
              <span>macOS {macVersion}</span>
            </div>
            <div className="register-actions">
              <Link href="/pricing" className="register-primary">
                View pricing →
              </Link>
              <Link href="/docs" className="register-secondary">
                Read the docs
              </Link>
            </div>
          </div>

          <div className="register-card">
            <div className="register-card__header">
              <span>Create account</span>
              <span className="register-card__pill">30 seconds</span>
            </div>
            <div className="register-card__form">
              <div className="register-field">
                <label>Full name</label>
                <input placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
                {fieldErrors.name ? <div className="field-error">{fieldErrors.name}</div> : null}
              </div>
              <div className="register-field">
                <label>Work email</label>
                <input placeholder="jane@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <div className={`email-indicator ${validateEmail(email) ? "email-indicator--ok" : "email-indicator--pending"}`}>
                  {email.length === 0 ? "Awaiting email" : validateEmail(email) ? "Email looks good" : "Invalid email"}
                </div>
                {fieldErrors.email ? <div className="field-error">{fieldErrors.email}</div> : null}
              </div>
              <div className="register-field">
                <label>Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {password.length > 0 && (
                  <>
                    <div className={`password-meter password-meter--${passwordStrength}`}>
                      <span />
                    </div>
                    <div className="password-hint">Strength: {passwordStrength.replace("-", " ")}</div>
                  </>
                )}
                <button type="button" className="password-generate" onClick={generatePassword}>
                  Generate strong password
                </button>
                {fieldErrors.password ? <div className="field-error">{fieldErrors.password}</div> : null}
              </div>
              <div className="register-field">
                <label>Org ID (optional)</label>
                <input placeholder="org_001" value={orgId} onChange={(e) => setOrgId(e.target.value)} />
              </div>
            </div>
            {status && <div className="signin-message signin-message--ok">{status}</div>}
            {error && <div className="signin-message signin-message--error">{error}</div>}
            <button className="register-submit" onClick={handleRegister} disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Start free"}
            </button>
            <div className="register-footnote">
              Already have an account? <Link href="/signin">Sign in</Link>
            </div>
          </div>
        </div>
        <div className="register-orb register-orb--one" />
        <div className="register-orb register-orb--two" />
      </section>
      <AppFooter />
    </main>
  );
}
