import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import ToolCard from "@/components/ToolCard";
import type { ToolIconName } from "@/components/ToolIcon";

const tools: Array<{
  title: string;
  description: string;
  href: string;
  icon: ToolIconName;
  badge?: string;
}> = [
  {
    title: "PDF to Word",
    description: "Export PDFs into DOCX for editing.",
    href: "/tools/pdf-to-word",
    icon: "pdf-to-word"
  },
  {
    title: "PDF to Pages",
    description: "Convert PDFs into Apple Pages files (macOS only).",
    href: "/tools/pdf-to-pages",
    icon: "pdf-to-word",
    badge: "macOS only"
  }
];

export default function XDocPage() {
  return (
    <main className="app-shell">
      <AppHeader />
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:px-10">
        <div className="mb-8">
          <p className="card-pill">X-DOC/DOCX</p>
          <h1 className="mt-4 font-display text-4xl text-ink-950">Document workflows</h1>
          <p className="mt-3 text-base text-obsidian-500">
            Start with PDF to Word while the rest of Doc Exchange is being wired in.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
