import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

export default function NoteflowLMPage() {
  return (
    <main className="app-shell">
      <AppHeader />
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <p className="card-pill">NOTEFLOWLM</p>
            <h1 className="mt-4 font-display text-4xl text-ink-950 md:text-5xl">
              Think with your documents, not just about them.
            </h1>
            <p className="mt-4 text-base text-obsidian-500">
              A premium, notebook-style AI workspace for research, synthesis, and decision-ready summaries.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="landing-pill">Private notebooks</span>
              <span className="landing-pill">Query over PDFs</span>
              <span className="landing-pill">Citations by default</span>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-ink-950">What’s coming</h3>
            <div className="mt-4 grid gap-3 text-sm text-obsidian-500">
              <div className="rounded-2xl bg-white px-4 py-3">Notebook imports from PDF Studio</div>
              <div className="rounded-2xl bg-white px-4 py-3">Ask questions, generate insights</div>
              <div className="rounded-2xl bg-white px-4 py-3">Enterprise knowledge controls</div>
            </div>
          </div>
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
