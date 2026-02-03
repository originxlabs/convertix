import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import PdfToolGrid from "@/components/PdfToolGrid";

export default function XPdfPage() {
  return (
    <main className="app-shell">
      <AppHeader />
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <p className="card-pill">PDF STUDIO</p>
            <h1 className="mt-4 font-display text-4xl text-ink-950 md:text-5xl">
              Professional PDF workflows with studio precision.
            </h1>
            <p className="mt-4 text-base text-obsidian-500">
              Merge, split, compress, secure, and edit PDFs with deterministic outputs and premium UX.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="landing-pill">Offline ready</span>
              <span className="landing-pill">Deterministic engines</span>
              <span className="landing-pill">Enterprise security</span>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-ink-950">Core workflows</h3>
            <div className="mt-4 grid gap-3 text-sm text-obsidian-500">
              <div className="rounded-2xl bg-white px-4 py-3">Edit, annotate, and export</div>
              <div className="rounded-2xl bg-white px-4 py-3">Organize pages with precision</div>
              <div className="rounded-2xl bg-white px-4 py-3">Protect, unlock, and redact</div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <PdfToolGrid />
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
