"use client";

import { useEffect, useMemo, useRef } from "react";

import type { EditorOverlay } from "@/lib/editorTypes";

type PdfFabricStageProps = {
  width: number;
  height: number;
  className?: string;
  onMouseDown?: () => void;
  onAddTextAt?: (x: number, y: number) => void;
  onCanvasClick?: (x: number, y: number) => void;
  pendingEditId?: string | null;
  onPendingEditHandled?: () => void;
  onEditingChange?: (editing: boolean, id?: string) => void;
  onSelectionChange?: (id?: string) => void;
  onReady?: (ready: boolean) => void;
  overlays: EditorOverlay[];
  pageIndex: number;
  scale: number;
  selectedId?: string;
  onSelectOverlay?: (id?: string) => void;
  onMoveOverlay?: (id: string, x: number, y: number) => void;
  onTextChange?: (id: string, text: string) => void;
};

type FabricObject = {
  overlayId?: string;
  left?: number;
  top?: number;
  type?: string;
  width?: number;
  height?: number;
  set?: (props: Record<string, unknown>) => void;
  setCoords?: () => void;
};

export default function PdfFabricStage({
  width,
  height,
  className,
  onMouseDown,
  onAddTextAt,
  onCanvasClick,
  pendingEditId,
  onPendingEditHandled,
  onEditingChange,
  onSelectionChange,
  onReady,
  overlays,
  pageIndex,
  scale,
  selectedId,
  onSelectOverlay,
  onMoveOverlay,
  onTextChange
}: PdfFabricStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<{ canvas: any; fabric: any } | null>(null);

  const pageOverlays = useMemo(
    () => overlays.filter((overlay) => overlay.page === pageIndex),
    [overlays, pageIndex]
  );

  useEffect(() => {
    let disposed = false;
    if (!canvasRef.current) return;
    if (fabricRef.current) return;

    const setup = async () => {
      const fabricModule = await import("fabric");
      const fabric = (fabricModule as any).fabric ?? fabricModule;
      if (disposed || !canvasRef.current) return;
      const canvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
        preserveObjectStacking: true
      });
      fabricRef.current = { canvas, fabric };
      onReady?.(true);

      const handleSelection = (event: any) => {
        const target = event.selected?.[0] as FabricObject | undefined;
        onSelectOverlay?.(target?.overlayId);
        onSelectionChange?.(target?.overlayId);
      };

      canvas.on("selection:created", handleSelection);
      canvas.on("selection:updated", handleSelection);
      canvas.on("selection:cleared", () => {
        onSelectOverlay?.(undefined);
        onSelectionChange?.(undefined);
      });
      canvas.on("mouse:down", (event: any) => {
        if (!event.target) {
          onMouseDown?.();
          if (event.pointer) {
            onCanvasClick?.(event.pointer.x / scale, event.pointer.y / scale);
          }
        }
      });

      canvas.on("object:modified", (event: any) => {
        const target = event.target as FabricObject | undefined;
        if (!target?.overlayId) return;
        const left = (target.left ?? 0) / scale;
        const top = (target.top ?? 0) / scale;
        onMoveOverlay?.(target.overlayId, left, top);
      });

      canvas.on("text:changed", (event: any) => {
        const target = event.target as (FabricObject & { text?: string }) | undefined;
        if (!target?.overlayId) return;
        onSelectOverlay?.(target.overlayId);
        onSelectionChange?.(target.overlayId);
        onTextChange?.(target.overlayId, target.text ?? "");
      });

      canvas.on("text:editing:entered", (event: any) => {
        const target = event.target as (FabricObject & { overlayId?: string }) | undefined;
        onEditingChange?.(true, target?.overlayId);
      });

      canvas.on("text:editing:exited", (event: any) => {
        const target = event.target as (FabricObject & { overlayId?: string }) | undefined;
        onEditingChange?.(false, target?.overlayId);
      });

      canvas.on("mouse:dblclick", (event: any) => {
        const target = event.target as (FabricObject & { enterEditing?: () => void; hiddenTextarea?: HTMLTextAreaElement }) | undefined;
        if (target?.enterEditing) {
          target.enterEditing();
          if (target.hiddenTextarea) {
            target.hiddenTextarea.focus();
          }
          return;
        }
        if (event.pointer) {
          onAddTextAt?.(event.pointer.x / scale, event.pointer.y / scale);
        }
      });
    };

    void setup();

    return () => {
      disposed = true;
      if (fabricRef.current?.canvas) {
        fabricRef.current.canvas.dispose();
        fabricRef.current = null;
        onReady?.(false);
      }
    };
  }, [onMoveOverlay, onMouseDown, onReady, onSelectOverlay, onTextChange, scale]);

  useEffect(() => {
    const handle = fabricRef.current;
    if (!handle) return;
    handle.canvas.setWidth(width);
    handle.canvas.setHeight(height);
    handle.canvas.calcOffset();
  }, [width, height]);

  useEffect(() => {
    const handle = fabricRef.current;
    if (!handle) return;
    const { canvas, fabric } = handle;

    const existing = new Map<string, FabricObject>();
    canvas.getObjects().forEach((obj) => {
      const fabricObj = obj as FabricObject;
      if (fabricObj.overlayId) {
        existing.set(fabricObj.overlayId, fabricObj);
      }
    });

    const nextIds = new Set<string>();
    pageOverlays.forEach((overlay) => {
      nextIds.add(overlay.id);
      const found = existing.get(overlay.id);
      if (overlay.type === "text") {
        if (found && (found.type === "i-text" || found.type === "textbox")) {
          const textbox = found as any;
          textbox.set({
            text: overlay.text,
            fontSize: overlay.fontSize,
            fill: overlay.color,
            left: overlay.x * scale,
            top: overlay.y * scale
          });
          textbox.setCoords();
          return;
        }

        const textbox = new fabric.IText(overlay.text, {
          left: overlay.x * scale,
          top: overlay.y * scale,
          fontSize: overlay.fontSize,
          fill: overlay.color,
          fontFamily: overlay.fontFamily ?? "Inter",
          editable: true,
          selectable: true,
          evented: true
        }) as any;
        textbox.overlayId = overlay.id;
        canvas.add(textbox);
        if (pendingEditId && pendingEditId === overlay.id) {
          canvas.setActiveObject(textbox);
          if (textbox.enterEditing) {
            textbox.enterEditing();
            if (textbox.hiddenTextarea) {
              textbox.hiddenTextarea.focus();
            }
          }
          onEditingChange?.(true, overlay.id);
          onPendingEditHandled?.();
        }
        return;
      }

      if (overlay.type === "image" || overlay.type === "signature") {
        if (found && found.type === "image") {
          const image = found as any;
          image.set({
            left: overlay.x * scale,
            top: overlay.y * scale
          });
          if (overlay.width > 0 && overlay.height > 0) {
            const scaleX = (overlay.width * scale) / (image.width ?? 1);
            const scaleY = (overlay.height * scale) / (image.height ?? 1);
            image.set({ scaleX, scaleY });
          }
          image.setCoords();
          return;
        }

        fabric.Image.fromURL(
          (overlay as { src?: string; data?: string }).src ??
            (overlay as { data?: string }).data ??
            "",
          (img) => {
            const fabricImg = img as any;
            fabricImg.overlayId = overlay.id;
            fabricImg.set({
              left: overlay.x * scale,
              top: overlay.y * scale
            });
            if (overlay.width > 0 && overlay.height > 0) {
              const scaleX = (overlay.width * scale) / (fabricImg.width ?? 1);
              const scaleY = (overlay.height * scale) / (fabricImg.height ?? 1);
              fabricImg.set({ scaleX, scaleY });
            }
            canvas.add(fabricImg);
            canvas.requestRenderAll();
          }
        );
        return;
      }

      if (overlay.type === "shape") {
        if (found && found.type === "rect") {
          const rect = found as any;
          rect.set({
            left: overlay.x * scale,
            top: overlay.y * scale,
            width: overlay.width * scale,
            height: overlay.height * scale,
            stroke: overlay.stroke,
            strokeWidth: overlay.strokeWidth,
            fill: overlay.fill ?? "transparent"
          });
          rect.setCoords();
          return;
        }

        const rect = new fabric.Rect({
          left: overlay.x * scale,
          top: overlay.y * scale,
          width: overlay.width * scale,
          height: overlay.height * scale,
          stroke: overlay.stroke,
          strokeWidth: overlay.strokeWidth,
          fill: overlay.fill ?? "transparent"
        }) as any;
        rect.overlayId = overlay.id;
        canvas.add(rect);
      }
    });

    canvas.getObjects().forEach((obj) => {
      const fabricObj = obj as FabricObject;
      if (fabricObj.overlayId && !nextIds.has(fabricObj.overlayId)) {
        canvas.remove(fabricObj);
      }
    });

    if (selectedId) {
      const selected = existing.get(selectedId) ??
        (canvas.getObjects().find((obj) => (obj as FabricObject).overlayId === selectedId) as
          | FabricObject
          | undefined);
      if (selected) {
        canvas.setActiveObject(selected);
      }
    } else {
      canvas.discardActiveObject();
    }

    canvas.requestRenderAll();
  }, [pageOverlays, scale, selectedId]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height }}
      aria-label="PDF overlay editor"
    />
  );
}
