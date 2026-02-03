"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveHistoryItem } from "@/lib/historyStore";

export default function ProtectPdfTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  const handlePick = () => fileInputRef.current?.click();

  const handleProtect = async () => {
    if (!file || !ownerPassword) return;
    setStatus("Protecting PDF...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ownerPassword", ownerPassword);
    if (userPassword) formData.append("userPassword", userPassword);
    const response = await fetch(`${apiBase}/api/pdf/protect`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      setStatus("Protection failed.");
      return;
    }
    const blob = await response.blob();
    await saveHistoryItem({
      name: `protected-${new Date().toISOString().slice(0, 10)}`,
      blob,
      kind: "pdf"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "protected.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Protected PDF downloaded.");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
              Source PDF
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">Protect & encrypt</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={handlePick}>
            Upload PDF
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <div className="mt-6 grid gap-4 text-sm text-ink-900">
          <label className="flex flex-col gap-2">
            Owner password (required)
            <input
              type="password"
              value={ownerPassword}
              onChange={(event) => setOwnerPassword(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2">
            User password (optional)
            <input
              type="password"
              value={userPassword}
              onChange={(event) => setUserPassword(event.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">Output</p>
        <div className="mt-4 grid gap-4 text-sm text-ink-900">
          <div className="rounded-2xl bg-white px-4 py-3">
            Owner password is required to edit or remove protection.
          </div>
          <Button onClick={handleProtect} disabled={!file || !ownerPassword}>
            Protect PDF
          </Button>
          {status && <div className="text-xs text-obsidian-500">{status}</div>}
        </div>
      </div>
    </div>
  );
}
