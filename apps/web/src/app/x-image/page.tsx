import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import ImageToolGrid from "@/components/ImageToolGrid";

export default function XImagePage() {
  return (
    <main className="app-shell">
      <AppHeader />
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <p className="card-pill">IMAGE LABS</p>
            <h1 className="mt-4 font-display text-4xl text-ink-950 md:text-5xl">
              Deterministic image pipelines, AI when you need it.
            </h1>
            <p className="mt-4 text-base text-obsidian-500">
              Compress, resize, convert, and enhance images with premium workflows and reliable output.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="landing-pill">Sharp + ImageMagick</span>
              <span className="landing-pill">Batch friendly</span>
              <span className="landing-pill">Pro-tier AI</span>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-ink-950">Production focus</h3>
            <div className="mt-4 grid gap-3 text-sm text-obsidian-500">
              <div className="rounded-2xl bg-white px-4 py-3">Deterministic transformations</div>
              <div className="rounded-2xl bg-white px-4 py-3">AI enhancements on Pro tier</div>
              <div className="rounded-2xl bg-white px-4 py-3">Secure processing boundaries</div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <ImageToolGrid />
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
