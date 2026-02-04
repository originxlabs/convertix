"use client";

import { useEffect, useMemo, useState } from "react";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

type StatusState = "checking" | "online" | "offline";

export default function StatusPage() {
  const [apiStatus, setApiStatus] = useState<StatusState>("checking");
  const [imageStatus, setImageStatus] = useState<StatusState>("checking");
  const [checkedAt, setCheckedAt] = useState<string>("");

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  useEffect(() => {
    let mounted = true;
    const checkAll = async () => {
      try {
        const response = await fetch(`${apiBase}/health`, { cache: "no-store" });
        if (mounted) setApiStatus(response.ok ? "online" : "offline");
      } catch {
        if (mounted) setApiStatus("offline");
      }

      try {
        const response = await fetch(`${apiBase}/api/image/health`, { cache: "no-store" });
        if (mounted) setImageStatus(response.ok ? "online" : "offline");
      } catch {
        if (mounted) setImageStatus("offline");
      }

      if (mounted) setCheckedAt(new Date().toLocaleString());
    };

    void checkAll();
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  return (
    <main className="landing-shell">
      <AppHeader />
      <section className="landing-section">
        <div className="landing-section__header">
          <h2>System status</h2>
          <p>Live connectivity check against the Azure API.</p>
        </div>
        <div className="landing-triad">
          <div className="studio-card">
            <h3>API</h3>
            <p className="studio-card__meta">Base URL: {apiBase}</p>
            <p className="studio-card__meta">Status: {apiStatus}</p>
          </div>
          <div className="studio-card">
            <h3>Image Engine</h3>
            <p className="studio-card__meta">Endpoint: /api/image/health</p>
            <p className="studio-card__meta">Status: {imageStatus}</p>
          </div>
          <div className="studio-card">
            <h3>Last check</h3>
            <p className="studio-card__meta">{checkedAt || "checking..."}</p>
          </div>
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
