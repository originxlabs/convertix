import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import HistoryGallery from "@/components/HistoryGallery";
import ClientPdfEditor from "@/components/pdf/ClientPdfEditor";
import CompressPdfTool from "@/components/tools/CompressPdfTool";
import CropPdfTool from "@/components/tools/CropPdfTool";
import ImageEditTool from "@/components/tools/ImageEditTool";
import ImageResizeTool from "@/components/tools/ImageResizeTool";
import ImageToPdfTool from "@/components/tools/ImageToPdfTool";
import MergePdfTool from "@/components/tools/MergePdfTool";
import OrganizePdfTool from "@/components/tools/OrganizePdfTool";
import PdfToImageTool from "@/components/tools/PdfToImageTool";
import PdfToWordTool from "@/components/tools/PdfToWordTool";
import ProtectPdfTool from "@/components/tools/ProtectPdfTool";
import SignPdfTool from "@/components/tools/SignPdfTool";
import SplitPdfTool from "@/components/tools/SplitPdfTool";
import StudioScaffoldTool from "@/components/tools/StudioScaffoldTool";
import UnlockPdfTool from "@/components/tools/UnlockPdfTool";

type ToolConfig = {
  title: string;
  description: string;
  component: React.ReactNode;
};

const toolMap: Record<string, ToolConfig> = {
  "edit-pdf": {
    title: "Edit PDF",
    description: "Add text, overlays, and export a polished document.",
    component: <ClientPdfEditor />
  },
  "pdf-to-image": {
    title: "PDF to Image",
    description: "Render pages into premium JPG or PNG files.",
    component: <PdfToImageTool />
  },
  "image-to-pdf": {
    title: "Image to PDF",
    description: "Bundle images into a single PDF with clean layout.",
    component: <ImageToPdfTool />
  },
  "image-resize": {
    title: "Image Resize",
    description: "Resize images with aspect ratio controls.",
    component: <ImageResizeTool />
  },
  "image-edit": {
    title: "Image Edit",
    description: "Refine brightness, contrast, saturation, and tone.",
    component: <ImageEditTool />
  },
  "pdf-to-word": {
    title: "PDF to Word",
    description: "Convert PDFs into DOCX files.",
    component: <PdfToWordTool />
  },
  "pdf-to-ppt": {
    title: "PDF to PowerPoint",
    description: "Turn PDFs into editable slides.",
    component: (
      <StudioScaffoldTool
        title="PDF to PowerPoint"
        eyebrow="Source PDF"
        description="Upload a PDF and create PPTX slides with consistent layout."
        accept="application/pdf"
        primaryActionLabel="Convert to PPTX"
        helperNotes={[
          "Layouts preserve text and imagery where possible.",
          "PowerPoint export will retain page order."
        ]}
      />
    )
  },
  "pdf-to-excel": {
    title: "PDF to Excel",
    description: "Extract tables into spreadsheets.",
    component: (
      <StudioScaffoldTool
        title="PDF to Excel"
        eyebrow="Source PDF"
        description="Upload a PDF and extract table data into XLSX."
        accept="application/pdf"
        primaryActionLabel="Convert to XLSX"
        helperNotes={[
          "Table detection works best on clean, vector PDFs.",
          "Exports preserve column alignment when possible."
        ]}
      />
    )
  },
  "word-to-pdf": {
    title: "Word to PDF",
    description: "Convert DOC/DOCX into a PDF.",
    component: (
      <StudioScaffoldTool
        title="Word to PDF"
        eyebrow="Source DOCX"
        description="Upload a Word document to generate a polished PDF."
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        primaryActionLabel="Convert to PDF"
        helperNotes={[
          "Fonts and layout are preserved where available.",
          "Great for sharing and approvals."
        ]}
      />
    )
  },
  "ppt-to-pdf": {
    title: "PowerPoint to PDF",
    description: "Export slides into PDF.",
    component: (
      <StudioScaffoldTool
        title="PowerPoint to PDF"
        eyebrow="Source PPTX"
        description="Upload a PowerPoint to export a ready-to-share PDF."
        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        primaryActionLabel="Convert to PDF"
        helperNotes={[
          "Slide order is preserved.",
          "Export is ideal for read-only sharing."
        ]}
      />
    )
  },
  "excel-to-pdf": {
    title: "Excel to PDF",
    description: "Convert XLS/XLSX into PDF.",
    component: (
      <StudioScaffoldTool
        title="Excel to PDF"
        eyebrow="Source Spreadsheet"
        description="Upload a spreadsheet to render a clean PDF."
        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        primaryActionLabel="Convert to PDF"
        helperNotes={[
          "Export keeps rows and columns aligned.",
          "Great for reports and read-only distribution."
        ]}
      />
    )
  },
  "merge-pdf": {
    title: "Merge PDF",
    description: "Combine PDFs into a single file.",
    component: <MergePdfTool />
  },
  "split-pdf": {
    title: "Split PDF",
    description: "Split PDFs into multiple files.",
    component: <SplitPdfTool />
  },
  "compress-pdf": {
    title: "Compress PDF",
    description: "Optimize file size while preserving quality.",
    component: <CompressPdfTool />
  },
  "protect-pdf": {
    title: "Protect PDF",
    description: "Encrypt PDFs with owner/user passwords.",
    component: <ProtectPdfTool />
  },
  "unlock-pdf": {
    title: "Unlock PDF",
    description: "Remove password protection from PDFs.",
    component: <UnlockPdfTool />
  },
  "organize-pdf": {
    title: "Organize PDF",
    description: "Reorder pages into a custom sequence.",
    component: <OrganizePdfTool />
  },
  "crop-pdf": {
    title: "Crop PDF",
    description: "Trim margins using pdfcpu crop settings.",
    component: <CropPdfTool />
  },
  "sign-pdf": {
    title: "Sign PDF",
    description: "Stamp signatures onto the first page.",
    component: <SignPdfTool />
  },
  "pdf-to-pdfa": {
    title: "PDF to PDF/A",
    description: "Archive-ready PDF/A conversion.",
    component: (
      <StudioScaffoldTool
        title="PDF to PDF/A"
        eyebrow="Archive PDF"
        description="Prepare PDF/A compliant files for long-term storage."
        accept="application/pdf"
        primaryActionLabel="Convert to PDF/A"
        helperNotes={[
          "Outputs are optimized for compliance and archiving.",
          "Best for legal and institutional storage."
        ]}
      />
    )
  },
  "scan-to-pdf": {
    title: "Scan to PDF",
    description: "Turn scans into clean PDFs.",
    component: (
      <StudioScaffoldTool
        title="Scan to PDF"
        eyebrow="Scanned Images"
        description="Upload scans or photos and produce a clean PDF."
        accept="image/*"
        multiple
        primaryActionLabel="Create PDF"
        helperNotes={[
          "Auto ordering preserves the upload sequence.",
          "Output is optimized for quick sharing."
        ]}
      />
    )
  },
  "ocr-pdf": {
    title: "OCR PDF",
    description: "Make PDFs searchable.",
    component: (
      <StudioScaffoldTool
        title="OCR PDF"
        eyebrow="Source PDF"
        description="Make scanned PDFs searchable with OCR text layers."
        accept="application/pdf"
        primaryActionLabel="Run OCR"
        helperNotes={[
          "Detects text in scanned documents.",
          "Outputs searchable and selectable PDFs."
        ]}
      />
    )
  }
};

function Placeholder({ title }: { title: string }) {
  return (
    <div className="glass-card rounded-3xl p-8 text-center">
      <p className="text-sm text-obsidian-500">Workflow coming next</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink-950">{title}</h2>
      <p className="mt-3 text-sm text-obsidian-500">
        We’re wiring this conversion flow into CONVERTIX. You’ll be able to run it here soon.
      </p>
    </div>
  );
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug;
  const tool = toolMap[slug];

  if (!tool) {
    const title = slug ? slug.replace(/-/g, " ").toUpperCase() : "TOOL";
    return (
      <main className="app-shell">
        <AppHeader />
        <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:px-10">
          <Placeholder title={title} />
        </section>
        <AppFooter />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <AppHeader />
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:px-10">
        <div className="mb-8">
          <p className="card-pill">CONVERTIX TOOL</p>
          <h1 className="mt-4 font-display text-4xl text-ink-950">{tool.title}</h1>
          <p className="mt-3 text-base text-obsidian-500">{tool.description}</p>
        </div>
        {tool.component}
        <div className="mt-10">
          <HistoryGallery />
        </div>
      </section>
      <AppFooter />
    </main>
  );
}
