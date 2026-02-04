"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAuthToken } from "@/lib/auth";
import { getApiBase } from "@/lib/apiBase";

export default function AppFooter() {
  const [activePolicy, setActivePolicy] = useState<"privacy" | "terms" | "refund" | "cookie" | null>(null);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const apiBase = useMemo(() => getApiBase(), []);

  useEffect(() => {
    const recordVisit = async () => {
      try {
        const token = getAuthToken();
        const today = new Date().toISOString().slice(0, 10);
        const key = `convertix-visit-${today}`;
        const shouldCount = !window.localStorage.getItem(key);

        const response = await fetch(
          `${apiBase}/api/analytics/${shouldCount ? "visit" : "visits/total"}`,
          {
            method: shouldCount ? "POST" : "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: shouldCount ? JSON.stringify({ path: window.location.pathname }) : undefined
          }
        );
        if (!response.ok) return;
        const json = (await response.json()) as { total?: number };
        if (typeof json.total === "number") {
          setVisitCount(json.total);
          if (shouldCount) {
            window.localStorage.setItem(key, "1");
          }
        }
      } catch {
        // Ignore analytics errors.
      }
    };
    recordVisit();
  }, [apiBase]);

  return (
    <footer className="border-t border-obsidian-200/70 bg-white/70 py-10 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-2xl bg-ink-900/5">
            <Image
              src="/convertix-logo-dark.svg"
              alt="Convertix logo"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-obsidian-500">
              CONVERTIX
            </div>
            <div className="text-sm font-medium text-ink-900">
              By OriginX Labs
            </div>
            <div className="mt-1 text-xs text-obsidian-500">
              Originally developed by Abhishek Panda, founder &amp; architect of OriginX Labs.
            </div>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-xs text-obsidian-500">
          <span>Studio-grade PDF &amp; image infrastructure for modern teams.</span>
          <Link href="/pricing" className="hover:text-ink-900">Pricing</Link>
          <Link href="/docs" className="hover:text-ink-900">Docs</Link>
          <Link href="/status" className="hover:text-ink-900">Status</Link>
          <span className="rounded-full border border-obsidian-200 bg-white px-3 py-1 text-[11px] text-obsidian-600">
            Visits: {visitCount ?? "—"}
          </span>
          <button type="button" onClick={() => setActivePolicy("privacy")} className="hover:text-ink-900">
            Privacy Policy
          </button>
          <button type="button" onClick={() => setActivePolicy("terms")} className="hover:text-ink-900">
            Terms &amp; Conditions
          </button>
          <button type="button" onClick={() => setActivePolicy("refund")} className="hover:text-ink-900">
            Refund Policy
          </button>
          <button type="button" onClick={() => setActivePolicy("cookie")} className="hover:text-ink-900">
            Cookie Policy
          </button>
        </div>
      </div>
      {activePolicy && (
        <div className="landing-modal">
          <div className="landing-modal__card">
            <div className="text-sm font-semibold text-ink-900">
              {activePolicy === "privacy" && "Privacy Policy"}
              {activePolicy === "terms" && "Terms & Conditions"}
              {activePolicy === "refund" && "Refund Policy"}
              {activePolicy === "cookie" && "Cookie Policy"}
            </div>
            <div className="mt-3 text-xs text-obsidian-600 leading-relaxed">
              {activePolicy === "privacy" && (
                <>
                  We collect only what is required to run Convertix: account email, authentication tokens,
                  usage analytics, and billing metadata. Files are processed securely and removed according to
                  your plan retention window. We never sell personal data, and you can request deletion at any time
                  by contacting OriginX Labs support.
                </>
              )}
              {activePolicy === "terms" && (
                <>
                  By using Convertix, you agree to lawful use of the platform. Abuse, automated misuse, or attempts
                  to bypass plan limits are prohibited. Plans renew automatically unless cancelled. Enterprise
                  agreements supersede these terms where applicable. We reserve the right to suspend accounts that
                  threaten platform stability or violate applicable law.
                </>
              )}
              {activePolicy === "refund" && (
                <>
                  Monthly subscriptions can be cancelled anytime. Annual plans are eligible for prorated refunds
                  within 14 days of purchase. For billing issues, contact OriginX Labs support within 7 days of payment.
                  Usage beyond plan limits may incur additional charges. Approved refunds are processed to the original
                  payment method.
                </>
              )}
              {activePolicy === "cookie" && (
                <>
                  Convertix uses essential cookies to keep you signed in, protect your session, and remember basic
                  preferences. We also use lightweight analytics to understand product usage and improve performance.
                  You can manage cookies in your browser settings at any time. Disabling essential cookies may limit
                  access to account and billing features.
                </>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => setActivePolicy(null)} className="landing-cta">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
