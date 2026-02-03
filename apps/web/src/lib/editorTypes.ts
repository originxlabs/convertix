export type EditorTool =
  | "Select"
  | "Text"
  | "Image"
  | "Annotate"
  | "Shape"
  | "Form"
  | "Sign"
  | "Page";

export type OverlayBase = {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
};

export type TextOverlay = OverlayBase & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily?: string;
  color: string;
};

export type ImageOverlay = OverlayBase & {
  type: "image";
  src: string;
};

export type AnnotationOverlay = OverlayBase & {
  type: "annotation";
  kind: "highlight" | "underline" | "strike" | "comment" | "freehand";
  color: string;
  thickness?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
};

export type ShapeOverlay = OverlayBase & {
  type: "shape";
  shape: "rect" | "ellipse" | "line" | "arrow";
  stroke: string;
  strokeWidth: number;
  fill?: string;
};

export type FormOverlay = OverlayBase & {
  type: "form";
  fieldType: "text" | "checkbox" | "radio" | "dropdown" | "signature";
  name: string;
  value?: string;
  required?: boolean;
};

export type SignatureOverlay = OverlayBase & {
  type: "signature";
  method: "draw" | "type" | "image";
  data: string;
};

export type EditorOverlay =
  | TextOverlay
  | ImageOverlay
  | AnnotationOverlay
  | ShapeOverlay
  | FormOverlay
  | SignatureOverlay;

export type EditorDocument = {
  fileId?: string;
  name?: string;
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  overlays: EditorOverlay[];
};

export type ExportPayload = {
  fileId: string;
  edits: EditorOverlay[];
  pageWidth: number;
  pageHeight: number;
};
