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
  past: EditorDocument[];
  future: EditorDocument[];
  setTool: (tool: EditorTool) => void;
  setDocMeta: (meta: Partial<EditorDocument>) => void;
  setFileId: (fileId?: string) => void;
  addOverlay: (overlay: EditorOverlay) => void;
  updateOverlay: (id: string, updates: Partial<EditorOverlay>) => void;
  removeOverlay: (id: string) => void;
  selectOverlay: (id?: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
};

const AUTOSAVE_KEY = "convertix-editor-autosave";

const loadAutosave = (): EditorDocument | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EditorDocument;
  } catch {
    return null;
  }
};

const saveAutosave = (doc: EditorDocument) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(doc));
  } catch {
    // ignore autosave failures
  }
};

export const useEditorStore = create<EditorState>((set) => {
  const initialDoc = loadAutosave() ?? emptyDoc;
  return {
  tool: "Select",
  doc: initialDoc,
  selectedId: undefined,
  past: [],
  future: [],
  setTool: (tool) => set({ tool }),
  setDocMeta: (meta) =>
    set((state) => {
      const nextDoc = { ...state.doc, ...meta };
      saveAutosave(nextDoc);
      return { doc: nextDoc, past: [...state.past, state.doc].slice(-50), future: [] };
    }),
  setFileId: (fileId) =>
    set((state) => {
      const nextDoc = { ...state.doc, fileId };
      saveAutosave(nextDoc);
      return { doc: nextDoc, past: [...state.past, state.doc].slice(-50), future: [] };
    }),
  addOverlay: (overlay) =>
    set((state) => {
      const nextDoc = { ...state.doc, overlays: [...state.doc.overlays, overlay] };
      saveAutosave(nextDoc);
      return { doc: nextDoc, past: [...state.past, state.doc].slice(-50), future: [] };
    }),
  updateOverlay: (id, updates) =>
    set((state) => {
      const nextDoc = {
        ...state.doc,
        overlays: state.doc.overlays.map((overlay) =>
          overlay.id === id ? ({ ...overlay, ...updates } as EditorOverlay) : overlay
        )
      };
      saveAutosave(nextDoc);
      return { doc: nextDoc, past: [...state.past, state.doc].slice(-50), future: [] };
    }),
  removeOverlay: (id) =>
    set((state) => {
      const nextDoc = {
        ...state.doc,
        overlays: state.doc.overlays.filter((overlay) => overlay.id !== id)
      };
      saveAutosave(nextDoc);
      return { doc: nextDoc, past: [...state.past, state.doc].slice(-50), future: [] };
    }),
  selectOverlay: (id) => set({ selectedId: id }),
  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const nextPast = state.past.slice(0, -1);
      saveAutosave(previous);
      return { doc: previous, past: nextPast, future: [state.doc, ...state.future] };
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const nextFuture = state.future.slice(1);
      saveAutosave(next);
      return { doc: next, past: [...state.past, state.doc].slice(-50), future: nextFuture };
    }),
  reset: () => {
    saveAutosave(emptyDoc);
    return { doc: emptyDoc, selectedId: undefined, tool: "Select", past: [], future: [] };
  }
  };
});
