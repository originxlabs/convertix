"use client";

import { Layer, Rect, Stage, Text } from "react-konva";

import type { EditorOverlay } from "@/lib/editorTypes";

type PdfKonvaStageProps = {
  width: number;
  height: number;
  className?: string;
  onMouseDown?: () => void;
  overlays: EditorOverlay[];
  pageIndex: number;
  scale: number;
};

export default function PdfKonvaStage({
  width,
  height,
  className,
  onMouseDown,
  overlays,
  pageIndex,
  scale
}: PdfKonvaStageProps) {
  return (
    <Stage width={width} height={height} className={className} onMouseDown={onMouseDown}>
      <Layer>
        {overlays
          .filter((overlay) => overlay.page === pageIndex)
          .map((overlay) => {
            if (overlay.type === "text") {
              return (
                <Text
                  key={overlay.id}
                  x={overlay.x * scale}
                  y={overlay.y * scale}
                  text={overlay.text}
                  fontSize={overlay.fontSize}
                  fill={overlay.color}
                />
              );
            }
            if (overlay.type === "shape") {
              return (
                <Rect
                  key={overlay.id}
                  x={overlay.x * scale}
                  y={overlay.y * scale}
                  width={overlay.width * scale}
                  height={overlay.height * scale}
                  stroke={overlay.stroke}
                  strokeWidth={overlay.strokeWidth}
                  fill={overlay.fill}
                />
              );
            }
            return null;
          })}
      </Layer>
    </Stage>
  );
}
