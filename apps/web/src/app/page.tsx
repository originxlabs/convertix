import Link from "next/link";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function Home() {
  return (
    <main className="app-shell">
      <AppHeader />

      <section className="relative z-10 mx-auto mt-14 grid w-full max-w-6xl gap-10 px-6 md:px-10">
        <div className="space-y-6">
          <p className="card-pill">Premium Workspace</p>
          <h1 className="font-display text-4xl text-ink-950 md:text-5xl">
            Every conversion flow you need — presented with Apple-level clarity.
          </h1>
          <p className="max-w-2xl text-base text-obsidian-500">
            CONVERTIX by OriginX Studio is a refined conversion suite built for precision. Pick a
            category below to edit PDFs, transform images, or convert documents with confidence.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/x-pdf" className="tool-card block p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
                  X-PDF
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-ink-950">PDF Studio</h2>
                <p className="mt-2 text-sm text-obsidian-500">
                  Edit, compress, merge, protect, and convert.
                </p>
              </div>
              <span className="rounded-full bg-obsidian-100 px-3 py-1 text-xs font-semibold text-ink-900">
                14 tools
              </span>
            </div>
          </Link>

          <Link href="/x-image" className="tool-card block p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
                  X-IMAGE
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-ink-950">Image Lab</h2>
                <p className="mt-2 text-sm text-obsidian-500">
                  Resize, edit, and convert images into PDFs.
                </p>
              </div>
              <span className="rounded-full bg-obsidian-100 px-3 py-1 text-xs font-semibold text-ink-900">
                6 tools
              </span>
            </div>
          </Link>

          <Link href="/x-doc" className="tool-card block p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian-500">
                  X-DOC/DOCX
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-ink-950">Doc Exchange</h2>
                <p className="mt-2 text-sm text-obsidian-500">
                  Convert Word, PDF/A, and secure documents.
                </p>
              </div>
              <span className="rounded-full bg-obsidian-100 px-3 py-1 text-xs font-semibold text-ink-900">
                8 tools
              </span>
            </div>
          </Link>
        </div>
      </section>

      <AppFooter />
    </main>
  );
}
