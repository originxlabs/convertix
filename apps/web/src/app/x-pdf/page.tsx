import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import PdfToolGrid from "@/components/PdfToolGrid";

export default function XPdfPage() {
  return (
    <main className="app-shell">
      <AppHeader />
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:px-10">
        <div className="mb-10 text-center">
          <p className="card-pill">X-PDF</p>
          <h1 className="mt-4 font-display text-4xl text-ink-950 md:text-5xl">
            Every tool you need to work with PDFs in one place
          </h1>
          <p className="mt-3 text-base text-obsidian-500">
            Merge, split, compress, convert, and secure PDFs with a premium workflow.
          </p>
        </div>
        <PdfToolGrid />
      </section>
      <AppFooter />
    </main>
  );
}
