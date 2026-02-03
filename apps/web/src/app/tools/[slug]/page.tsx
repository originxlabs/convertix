import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import HistoryGallery from "@/components/HistoryGallery";
import ClientPdfEditor from "@/components/pdf/ClientPdfEditor";
import CompressPdfTool from "@/components/tools/CompressPdfTool";
import CropPdfTool from "@/components/tools/CropPdfTool";
import HtmlToImageTool from "@/components/tools/HtmlToImageTool";
import ImageEditTool from "@/components/tools/ImageEditTool";
import ImageAiTool from "@/components/tools/ImageAiTool";
import ImageProcessTool from "@/components/tools/ImageProcessTool";
import ImageResizeTool from "@/components/tools/ImageResizeTool";
import ImageToPdfTool from "@/components/tools/ImageToPdfTool";
import MergePdfTool from "@/components/tools/MergePdfTool";
import OrganizePdfTool from "@/components/tools/OrganizePdfTool";
import PdfToImageTool from "@/components/tools/PdfToImageTool";
import PdfToPagesTool from "@/components/tools/PdfToPagesTool";
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
  "image-compress": {
    title: "Compress Image",
    description: "Shrink images without losing quality.",
    component: (
      <ImageProcessTool
        title="Compress Image"
        eyebrow="Source Images"
        description="Upload images and compress them for faster sharing."
        accept="image/*"
        multiple
        operation="compress"
        outputExtension="jpg"
        outputMime="image/jpeg"
        fields={[{ name: "quality", label: "Quality (1-100)", type: "number", defaultValue: "80" }]}
        helperNotes={["Best for JPG and PNG.", "Export retains visual quality."]}
      />
    )
  },
  "image-crop": {
    title: "Crop Image",
    description: "Crop and trim images with precision.",
    component: (
      <ImageProcessTool
        title="Crop Image"
        eyebrow="Source Image"
        description="Upload an image and crop it to the desired frame."
        accept="image/*"
        operation="crop"
        outputExtension="png"
        outputMime="image/png"
        fields={[
          { name: "left", label: "Left (px)", type: "number", defaultValue: "0" },
          { name: "top", label: "Top (px)", type: "number", defaultValue: "0" },
          { name: "width", label: "Width (px)", type: "number", defaultValue: "400" },
          { name: "height", label: "Height (px)", type: "number", defaultValue: "300" }
        ]}
        helperNotes={["Supports JPG, PNG, and GIF.", "Crop is non-destructive until export."]}
      />
    )
  },
  "image-convert-to-jpg": {
    title: "Convert to JPG",
    description: "Convert images into JPG.",
    component: (
      <ImageProcessTool
        title="Convert to JPG"
        eyebrow="Source Images"
        description="Convert PNG, SVG, TIFF, HEIC to JPG."
        accept="image/*"
        multiple
        operation="convert-to-jpg"
        outputExtension="jpg"
        outputMime="image/jpeg"
        helperNotes={["Batch convert supported.", "Controls quality and size."]}
      />
    )
  },
  "image-convert-from-jpg": {
    title: "Convert from JPG",
    description: "Convert JPG into PNG or GIF.",
    component: (
      <ImageProcessTool
        title="Convert from JPG"
        eyebrow="Source JPG"
        description="Convert JPGs into PNG or GIF formats."
        accept="image/jpeg"
        multiple
        operation="convert-from-jpg"
        outputExtension="png"
        outputMime="image/png"
        fields={[
          {
            name: "format",
            label: "Output format",
            type: "select",
            options: [
              { label: "PNG", value: "png" },
              { label: "GIF", value: "gif" }
            ],
            defaultValue: "png"
          }
        ]}
        helperNotes={["Great for transparent PNG workflows.", "Batch conversion supported."]}
      />
    )
  },
  "image-upscale": {
    title: "Upscale Image",
    description: "Increase resolution with enhanced clarity.",
    component: (
      <ImageAiTool
        title="Upscale Image"
        eyebrow="Source Image"
        description="Upscale images using AI-driven super resolution."
        accept="image/*"
        endpoint="/api/image/upscale"
        outputExtension="png"
        outputMime="image/png"
        helperNotes={["Pro tier uses AI super-resolution.", "Best for product shots and scans."]}
      />
    )
  },
  "image-remove-bg": {
    title: "Remove Background",
    description: "Remove image backgrounds with clean cutouts.",
    component: (
      <ImageAiTool
        title="Remove Background"
        eyebrow="Source Image"
        description="Remove backgrounds and export transparent PNGs."
        accept="image/*"
        endpoint="/api/image/remove-bg"
        outputExtension="png"
        outputMime="image/png"
        helperNotes={["Pro tier uses AI segmentation.", "Exports PNG with transparency."]}
      />
    )
  },
  "image-watermark": {
    title: "Watermark Image",
    description: "Stamp text or logos on images.",
    component: (
      <StudioScaffoldTool
        title="Watermark Image"
        eyebrow="Source Images"
        description="Apply watermarks across image sets."
        accept="image/*"
        multiple
        primaryActionLabel="Add Watermark"
        helperNotes={["Control opacity and position.", "Batch processing supported."]}
      />
    )
  },
  "image-meme": {
    title: "Meme Generator",
    description: "Create meme templates with captions.",
    component: (
      <ImageAiTool
        title="Meme Generator"
        eyebrow="Source Image"
        description="Create memes with captions via AI templates."
        accept="image/*"
        endpoint="/api/image/meme"
        outputExtension="png"
        outputMime="image/png"
        fields={[
          { name: "templateId", label: "Template ID", type: "text", placeholder: "e.g. 61579" },
          { name: "topText", label: "Top text", type: "text" },
          { name: "bottomText", label: "Bottom text", type: "text" }
        ]}
        helperNotes={["Pro tier uses meme rendering API.", "Provide a template ID for best results."]}
      />
    )
  },
  "image-rotate": {
    title: "Rotate Image",
    description: "Rotate images in batch.",
    component: (
      <ImageProcessTool
        title="Rotate Image"
        eyebrow="Source Images"
        description="Rotate images by 90/180/270 degrees."
        accept="image/*"
        multiple
        operation="rotate"
        outputExtension="png"
        outputMime="image/png"
        fields={[{ name: "angle", label: "Angle (degrees)", type: "number", defaultValue: "90" }]}
        helperNotes={["Batch processing supported.", "Great for scanned photos."]}
      />
    )
  },
  "html-to-image": {
    title: "HTML to Image",
    description: "Render a URL into an image.",
    component: <HtmlToImageTool />
  },
  "image-blur-face": {
    title: "Blur Face",
    description: "Blur faces or plates for privacy.",
    component: (
      <ImageAiTool
        title="Blur Face"
        eyebrow="Source Image"
        description="Detect faces and apply privacy blur."
        accept="image/*"
        endpoint="/api/image/blur-face"
        outputExtension="png"
        outputMime="image/png"
        helperNotes={["Pro tier uses AI face detection.", "Ideal for privacy workflows."]}
      />
    )
  },
  "pdf-to-word": {
    title: "PDF to Word",
    description: "Convert PDFs into DOCX files.",
    component: <PdfToWordTool />
  },
  "pdf-to-pages": {
    title: "PDF to Pages",
    description: "Convert PDFs into Apple Pages files (macOS only).",
    component: <PdfToPagesTool />
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
        helperNotes={["Layouts preserve text and imagery where possible.", "PowerPoint export will retain page order."]}
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
        helperNotes={["Table detection works best on clean, vector PDFs.", "Exports preserve column alignment when possible."]}
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
        helperNotes={["Fonts and layout are preserved where available.", "Great for sharing and approvals."]}
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
        helperNotes={["Slide order is preserved.", "Export is ideal for read-only sharing."]}
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
        helperNotes={["Export keeps rows and columns aligned.", "Great for reports and read-only distribution."]}
      />
    )
  },
  "html-to-pdf": {
    title: "HTML to PDF",
    description: "Convert web pages into PDF.",
    component: (
      <StudioScaffoldTool
        title="HTML to PDF"
        eyebrow="Source URL"
        description="Provide a URL to render into a PDF."
        accept="text/plain"
        primaryActionLabel="Convert to PDF"
        helperNotes={["Best for static pages.", "CSS print styles are respected when available."]}
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
  "remove-pages": {
    title: "Remove Pages",
    description: "Delete pages from a PDF.",
    component: (
      <StudioScaffoldTool
        title="Remove Pages"
        eyebrow="Source PDF"
        description="Upload a PDF and remove selected pages."
        accept="application/pdf"
        primaryActionLabel="Remove Pages"
        helperNotes={["Use comma-separated pages or ranges.", "Example: 1,3,5-7"]}
      />
    )
  },
  "extract-pages": {
    title: "Extract Pages",
    description: "Export selected pages into a new PDF.",
    component: (
      <StudioScaffoldTool
        title="Extract Pages"
        eyebrow="Source PDF"
        description="Extract selected pages into a new document."
        accept="application/pdf"
        primaryActionLabel="Extract Pages"
        helperNotes={["Use comma-separated pages or ranges.", "Example: 2,4,8-10"]}
      />
    )
  },
  "compress-pdf": {
    title: "Compress PDF",
    description: "Optimize file size while preserving quality.",
    component: <CompressPdfTool />
  },
  "repair-pdf": {
    title: "Repair PDF",
    description: "Fix broken PDFs and recover structure.",
    component: (
      <StudioScaffoldTool
        title="Repair PDF"
        eyebrow="Source PDF"
        description="Upload a PDF and run automated repair routines."
        accept="application/pdf"
        primaryActionLabel="Repair PDF"
        helperNotes={["Best for PDFs that fail to open or render.", "Repair preserves visible content where possible."]}
      />
    )
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
  "rotate-pdf": {
    title: "Rotate PDF",
    description: "Rotate pages for correct orientation.",
    component: (
      <StudioScaffoldTool
        title="Rotate PDF"
        eyebrow="Source PDF"
        description="Rotate selected pages by 90/180/270 degrees."
        accept="application/pdf"
        primaryActionLabel="Rotate PDF"
        helperNotes={["Rotate by page range or all pages.", "Keeps content crisp and aligned."]}
      />
    )
  },
  "add-page-numbers": {
    title: "Add Page Numbers",
    description: "Insert page numbers into a PDF.",
    component: (
      <StudioScaffoldTool
        title="Add Page Numbers"
        eyebrow="Source PDF"
        description="Apply page numbers with style and alignment."
        accept="application/pdf"
        primaryActionLabel="Add Numbers"
        helperNotes={["Supports header/footer placement.", "Choose fonts and offsets."]}
      />
    )
  },
  "add-watermark": {
    title: "Add Watermark",
    description: "Stamp watermarks across pages.",
    component: (
      <StudioScaffoldTool
        title="Add Watermark"
        eyebrow="Source PDF"
        description="Add text or image watermarks to pages."
        accept="application/pdf"
        primaryActionLabel="Add Watermark"
        helperNotes={["Control opacity and rotation.", "Apply to all or selected pages."]}
      />
    )
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
  "redact-pdf": {
    title: "Redact PDF",
    description: "Permanently remove sensitive content.",
    component: (
      <StudioScaffoldTool
        title="Redact PDF"
        eyebrow="Source PDF"
        description="Apply redactions to remove sensitive information."
        accept="application/pdf"
        primaryActionLabel="Redact PDF"
        helperNotes={["Redactions are permanent.", "Use for compliance and privacy."]}
      />
    )
  },
  "compare-pdf": {
    title: "Compare PDF",
    description: "Diff two PDFs for changes.",
    component: (
      <StudioScaffoldTool
        title="Compare PDF"
        eyebrow="Source PDFs"
        description="Upload two PDFs and compare content changes."
        accept="application/pdf"
        multiple
        primaryActionLabel="Compare PDFs"
        helperNotes={["Highlights text and layout changes.", "Best for review workflows."]}
      />
    )
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
        helperNotes={["Outputs are optimized for compliance and archiving.", "Best for legal and institutional storage."]}
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
        helperNotes={["Auto ordering preserves the upload sequence.", "Output is optimized for quick sharing."]}
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
        helperNotes={["Detects text in scanned documents.", "Outputs searchable and selectable PDFs."]}
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
