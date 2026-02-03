import { create } from "zustand";
import type { EditorDocument, EditorOverlay, EditorTool } from "@/lib/editorTypes";

const emptyDoc: EditorDocument = {
  pageCount: 0,
  pageWidth: 0,
  pageHeight: 0,
  overlays: []
};

type EditorState = {
  tool: EditorTool;
  doc: EditorDocument;
  selectedId?: string;
  setTool: (tool: EditorTool) => void;
  setDocMeta: (meta: Partial<EditorDocument>) => void;
  setFileId: (fileId?: string) => void;
  addOverlay: (overlay: EditorOverlay) => void;
  updateOverlay: (id: string, updates: Partial<EditorOverlay>) => void;
  removeOverlay: (id: string) => void;
  selectOverlay: (id?: string) => void;
  reset: () => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  tool: "Select",
  doc: emptyDoc,
  selectedId: undefined,
  setTool: (tool) => set({ tool }),
  setDocMeta: (meta) =>
    set((state) => ({ doc: { ...state.doc, ...meta } })),
  setFileId: (fileId) =>
    set((state) => ({ doc: { ...state.doc, fileId } })),
  addOverlay: (overlay) =>
    set((state) => ({ doc: { ...state.doc, overlays: [...state.doc.overlays, overlay] } })),
  updateOverlay: (id, updates) =>
    set((state) => ({
      doc: {
        ...state.doc,
        overlays: state.doc.overlays.map((overlay) =>
          overlay.id === id ? ({ ...overlay, ...updates } as EditorOverlay) : overlay
        )
      }
    })),
  removeOverlay: (id) =>
    set((state) => ({
      doc: { ...state.doc, overlays: state.doc.overlays.filter((overlay) => overlay.id !== id) }
    })),
  selectOverlay: (id) => set({ selectedId: id }),
  reset: () => set({ doc: emptyDoc, selectedId: undefined, tool: "Select" })
}));
