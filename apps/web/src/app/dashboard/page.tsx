"use client";

import { useEffect, useMemo, useState } from "react";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import { getApiBase } from "@/lib/apiBase";

type Tier = { tier: string; name: string; description: string };
type Pricing = { tier: string; priceMonthly: number; priceYearly: number; currency: string };
type Entitlement = { tier: string; expiresAt?: string; orgId?: string };

export default function DashboardPage() {
  const apiBase = getApiBase();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planSelection, setPlanSelection] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  const userId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("convertix-user-id");
  }, []);

  useEffect(() => {
    if (!userId) {
      window.location.href = "/signin";
      return;
    }
    const selected = new URLSearchParams(window.location.search).get("plan");
    const saved = window.localStorage.getItem("convertix-selected-plan");
    setPlanSelection(selected ?? saved);

    const fetchAll = async () => {
      try {
        const token = window.localStorage.getItem("convertix-auth-token");
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [tiersRes, pricingRes, entRes, creditsRes, usageRes, meRes] = await Promise.all([
          fetch(`${apiBase}/api/billing/tiers`, authHeaders ? { headers: authHeaders } : undefined),
          fetch(`${apiBase}/api/billing/pricing?userId=${userId}`, authHeaders ? { headers: authHeaders } : undefined),
          fetch(`${apiBase}/api/billing/entitlement?userId=${userId}`, authHeaders ? { headers: authHeaders } : undefined),
          fetch(`${apiBase}/api/billing/credits/balance?userId=${userId}`, authHeaders ? { headers: authHeaders } : undefined),
          fetch(`${apiBase}/api/billing/usage?userId=${userId}`, authHeaders ? { headers: authHeaders } : undefined),
          fetch(`${apiBase}/api/users/me`, authHeaders ? { headers: authHeaders } : undefined)
        ]);
        if (!tiersRes.ok || !pricingRes.ok) throw new Error("Billing endpoints not available.");
        const tiersJson = await tiersRes.json();
        const pricingJson = await pricingRes.json();
        setTiers(tiersJson);
        setPricing(pricingJson);
        if (entRes.ok) setEntitlement(await entRes.json());
        if (creditsRes.ok) {
          const creditPayload = await creditsRes.json();
          setCredits(creditPayload.balance ?? 0);
        }
        if (usageRes.ok) {
          const usagePayload = await usageRes.json();
          setUsage(usagePayload.buckets ?? {});
        }
        if (meRes.ok) {
          const mePayload = await meRes.json();
          setEmail(mePayload.email ?? "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load billing data.");
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, [apiBase, userId]);

  const startCheckout = async () => {
    if (!userId || !planSelection) return;
    setCheckoutStatus("Starting checkout...");
    const res = await fetch(`${apiBase}/api/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        tier: planSelection,
        billingCycle: planSelection === "pro" ? "monthly" : "monthly",
        name,
        email
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCheckoutStatus(typeof payload === "string" ? payload : payload?.error ?? "Checkout failed.");
      return;
    }
    if (payload.status === "trial") {
      setCheckoutStatus("Trial activated. All features unlocked.");
      setEntitlement({ tier: payload.tier, expiresAt: payload.expiresAt, orgId: payload.orgId ?? undefined });
      return;
    }
    if (payload.short_url) {
      window.location.href = payload.short_url;
      return;
    }
    setCheckoutStatus("Checkout created. Please complete payment in Razorpay.");
  };

  const requestCredits = async (amount: number) => {
    if (!userId) return;
    const res = await fetch(`${apiBase}/api/billing/credits/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, reason: "topup" })
    });
    if (res.ok) {
      const payload = await res.json();
      setCredits(payload.balance ?? credits);
    }
  };

  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="dashboard-shell fade-in">
        <h1>Account dashboard</h1>
        <p className="dashboard-subtitle">View plans, usage, credits, and entitlements.</p>

        {error && <div className="dashboard-error">{error}</div>}
        {loading && <div className="dashboard-card">Loading billing data…</div>}

        {!loading && (
          <>
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Plan & Entitlement</h3>
                <p>Current tier: {entitlement?.tier ?? "free"}</p>
                <p>Expires: {entitlement?.expiresAt ?? "No expiry"}</p>
                <p>Org: {entitlement?.orgId ?? "Personal"}</p>
              </div>
              <div className="dashboard-card">
                <h3>Credits</h3>
                <p>Balance: {credits ?? 0}</p>
                <div className="dashboard-actions">
                  <button onClick={() => requestCredits(50)}>Add 50 credits</button>
                  <button onClick={() => requestCredits(120)}>Add 120 credits</button>
                </div>
              </div>
              <div className="dashboard-card">
                <h3>Usage</h3>
                <div className="dashboard-usage">
                  {Object.keys(usage).length === 0 && "No usage data yet."}
                  {Object.entries(usage).map(([feature, count]) => (
                    <div key={feature}>{feature}: {count}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Available tiers</h3>
              <div className="dashboard-tiers">
                {tiers.map((tier) => {
                  const price = pricing.find((p) => p.tier === tier.tier);
                  return (
                    <div key={tier.tier} className="dashboard-tier">
                      <div>
                        <strong>{tier.name}</strong>
                        <p>{tier.description}</p>
                      </div>
                      <div>
                        ₹{price?.priceMonthly ?? 0} / mo
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {planSelection && (
              <div className="dashboard-card dashboard-card--highlight">
                <h3>Complete your plan upgrade</h3>
                <p>Selected plan: {planSelection}</p>
                <div className="dashboard-form">
                  <input
                    placeholder="Full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <input placeholder="Email" value={email} readOnly />
                  <button onClick={startCheckout}>Proceed to Razorpay</button>
                  {checkoutStatus && <div className="dashboard-subtitle">{checkoutStatus}</div>}
                </div>
              </div>
            )}
          </>
        )}
      </section>
      <AppFooter />
    </main>
  );
}
