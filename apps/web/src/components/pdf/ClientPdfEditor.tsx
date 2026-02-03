"use client";

import dynamic from "next/dynamic";

const PdfEditor = dynamic(() => import("@/components/pdf/PdfEditor"), {
  ssr: false
});

export default function ClientPdfEditor() {
  return <PdfEditor />;
}
