import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import ToolCard from "@/components/ToolCard";

const tools = [
  {
    title: "Image Resize",
    description: "Resize with aspect lock and export instantly.",
    href: "/tools/image-resize",
    badge: "Live",
    icon: "img-resize"
  },
  {
    title: "Image Edit",
    description: "Adjust brightness, contrast, saturation, and tone.",
    href: "/tools/image-edit",
    badge: "Live",
    icon: "img-edit"
  },
  {
    title: "Image to PDF",
    description: "Bundle images into a single PDF.",
    href: "/tools/image-to-pdf",
    badge: "Live",
    icon: "img-convert-from-jpg"
  },
  {
    title: "PDF to Image",
    description: "Export PDF pages as high-res images.",
    href: "/tools/pdf-to-image",
    badge: "Live",
    icon: "img-convert-jpg"
  }
];

export default function XImagePage() {
  return (
    <main className="app-shell">
      <AppHeader />
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:px-10">
        <div className="mb-8">
          <p className="card-pill">X-IMAGE</p>
          <h1 className="mt-4 font-display text-4xl text-ink-950">Image workflows</h1>
          <p className="mt-3 text-base text-obsidian-500">
            Resize, edit, and convert images with refined controls.
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
