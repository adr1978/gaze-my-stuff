import { useRef, useEffect, useState, Fragment } from "react";
import { LayerState } from "@/types";
import { RotateCw } from "lucide-react";

interface CanvasEditorProps {
  layers: LayerState[];
  backgroundColor: string;
  canvasWidth: number;
  canvasHeight: number;
  selectedLayerIds: string[];
  onPositionChange: (position: { x: number; y: number }) => void;
  transformMode: boolean;
  onTransformModeExit: () => void;
  onTransformModeEnter: () => void;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onLayerSelection: (layerId: string, shiftKey: boolean) => void;
}

export const CanvasEditor = ({
  layers,
  backgroundColor,
  canvasWidth,
  canvasHeight,
  selectedLayerIds,
  onPositionChange,
  transformMode,
  onTransformModeExit,
  onTransformModeEnter,
  onScaleChange,
  onRotationChange,
  onLayerSelection,
}: CanvasEditorProps) => {
  const activeLayerId = selectedLayerIds.length === 1 ? selectedLayerIds[0] : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<"corner" | "rotation" | null>(null);
  const [dragCorner, setDragCorner] = useState<"tl" | "tr" | "bl" | "br" | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [initialRotation, setInitialRotation] = useState(0);

  // Geometry captured at mousedown for correct anchored transforms:
  const [initialCenter, setInitialCenter] = useState<{ x: number; y: number } | null>(null);
  const [initialCornerPoint, setInitialCornerPoint] = useState<{ x: number; y: number } | null>(null);
  const [initialAnchorPoint, setInitialAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [initialDistCornerAnchor, setInitialDistCornerAnchor] = useState<number>(1);
  const [initialDistCornerCenter, setInitialDistCornerCenter] = useState<number>(1);

  // NEW: Track initial position for Shift-constrained dragging
  const [initialDragPosition, setInitialDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false); // Track if user has moved mouse after mousedown

  const handleSize = 12;
  const padding = 8;

  // Get active layer + position quickly
  const activeLayer = layers.find((l) => l.id === activeLayerId) ?? null;
  const activeLayerPosition = activeLayer?.position ?? null;

  // NEW: when the active layer has a pattern applied, ensure we exit transform mode in parent.
  // This guarantees the Transform button is disabled in the parent and the bounding box will be removed.
  useEffect(() => {
    // pattern property exists in LayerState; be defensive in case shape differs
    const layerPattern = (activeLayer as any)?.pattern;
    if (transformMode && activeLayer && layerPattern && layerPattern !== "none") {
      onTransformModeExit();
    }
    // run when pattern or transformMode changes
  }, [activeLayer?.pattern, transformMode, activeLayer, onTransformModeExit]);

  // Draw canvas whenever layers/background change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (backgroundColor && backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw layers
    for (const layer of layers) {
      if (!layer.image) continue;
      const {
        image,
        scale,
        rotation,
        opacity,
        position,
        pattern,
        spacing,
        randomPatternData,
      } = layer;

      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;

      if (pattern === "none") {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
      } else {
        ctx.globalAlpha = opacity;
        if (pattern === "random" || pattern === "spread") {
          for (const item of randomPatternData) {
            const finalScale = scale * item.scaleJitter;
            const finalRotation = rotation + item.rotationJitter;
            const w = image.width * finalScale;
            const h = image.height * finalScale;

            ctx.save();
            ctx.translate(item.x + w / 2 + position.x, item.y + h / 2 + position.y);
            ctx.rotate((finalRotation * Math.PI) / 180);
            ctx.drawImage(image, -w / 2, -h / 2, w, h);
            ctx.restore();
          }
        } else {
          const stepX = scaledWidth + spacing;
          const stepY = scaledHeight + spacing;
          for (let y = -scaledHeight; y < canvas.height + scaledHeight; y += stepY) {
            for (let x = -scaledWidth; x < canvas.width + scaledWidth; x += stepX) {
              let offsetX = x;
              let offsetY = y;
              if (pattern === "brick") {
                const rowIndex = Math.floor((y + scaledHeight) / stepY);
                if (rowIndex % 2 === 1) offsetX += stepX / 2;
              }
              const rowIndex = Math.floor((y + scaledHeight) / stepY);

              ctx.save();
              ctx.translate(offsetX + scaledWidth / 2 + position.x, offsetY + scaledHeight / 2 + position.y);
              let tileRotation = rotation;
              if (pattern === "diamonds") tileRotation = rotation + 45;
              if (pattern === "mirror" && rowIndex % 2 === 1) tileRotation += 180;
              ctx.rotate((tileRotation * Math.PI) / 180);
              ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
              ctx.restore();
            }
          }
        }
      }
    }
  }, [layers, backgroundColor]);

  // Utility: convert client coords to canvas coords
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Compute bounding box corners in canvas coords (order: tl, tr, br, bl)
  const getBoundingBox = (layer: LayerState) => {
    if (!layer) return null;
    const { image, scale, rotation, position } = layer;
    const w = image.width * scale;
    const h = image.height * scale;

    const corners = [
      { x: -w / 2, y: -h / 2 }, // tl
      { x: w / 2, y: -h / 2 }, // tr
      { x: w / 2, y: h / 2 }, // br
      { x: -w / 2, y: h / 2 }, // bl
    ];

    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return corners.map((c) => ({
      x: c.x * cos - c.y * sin + position.x,
      y: c.x * sin + c.y * cos + position.y,
    }));
  };

  // Return corner key at point (if within handle)
  const getCornerAtPoint = (x: number, y: number, handle = handleSize) => {
    // Only works for active layer in transform mode
    if (!activeLayer) return null;
    const box = getBoundingBox(activeLayer);
    if (!box) return null;
    const corners = [
      { key: "tl" as const, pos: box[0] },
      { key: "tr" as const, pos: box[1] },
      { key: "br" as const, pos: box[2] },
      { key: "bl" as const, pos: box[3] },
    ];
    for (const c of corners) {
      const dist = Math.hypot(x - c.pos.x, y - c.pos.y);
      if (dist <= handle) return c.key;
    }
    return null;
  };

  // Rotation handle check (midpoint of top edge)
  const isNearRotationHandle = (x: number, y: number, handle = handleSize) => {
    if (!activeLayer) return false;
    const box = getBoundingBox(activeLayer);
    if (!box) return false;
    const midX = (box[0].x + box[1].x) / 2;
    const midY = (box[0].y + box[1].y) / 2;
    return Math.hypot(x - midX, y - midY) <= handle;
  };

  // Is point inside extended bounding box of a specific layer
  const isInsideBoundingBox = (layer: LayerState, x: number, y: number, extra = 30) => {
    if (!layer) return false;
    const { image, scale, rotation, position } = layer;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = x - position.x;
    const dy = y - position.y;
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;
    const w = (image.width * scale) / 2 + padding + extra;
    const h = (image.height * scale) / 2 + padding + extra;
    return Math.abs(localX) <= w && Math.abs(localY) <= h;
  };

  // NEW: Check if a point hits a non-transparent pixel of a layer
  const isPointOnLayer = (layer: LayerState, x: number, y: number): boolean => {
    const { image, scale, rotation, position, pattern } = layer;
    
    // Only check for "none" pattern layers
    if (pattern !== "none") return false;

    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Transform point to layer's local space
    const dx = x - position.x;
    const dy = y - position.y;
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    // Check if point is within layer bounds
    if (Math.abs(localX) > scaledWidth / 2 || Math.abs(localY) > scaledHeight / 2) {
      return false;
    }
    
    // Convert to image pixel coordinates
    const imgX = Math.floor((localX + scaledWidth / 2) / scale);
    const imgY = Math.floor((localY + scaledHeight / 2) / scale);
    
    // Check bounds
    if (imgX < 0 || imgX >= image.width || imgY < 0 || imgY >= image.height) {
      return false;
    }
    
    // Check alpha value at this pixel
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return false;
    
    ctx.drawImage(image, 0, 0);
    const pixelData = ctx.getImageData(imgX, imgY, 1, 1).data;
    
    // Check if alpha > 10 (essentially non-transparent)
    return pixelData[3] > 10;
  };

  // NEW: Find topmost layer at point (checking from top to bottom)
  const getLayerAtPoint = (x: number, y: number): string | null => {
    // Check layers in reverse order (top to bottom)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (isPointOnLayer(layer, x, y)) {
        return layer.id;
      }
    }
    return null;
  };

  // Mouse down: generalized to HTMLElement so it can be attached to overlay/container
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    
    // Reset drag tracking
    setHasDragged(false);
    
    // Check for rotation/scale handles FIRST (only available for single active layer in transform mode)
    if (transformMode && activeLayer) {
      // Rotation handle
      if (isNearRotationHandle(x, y)) {
        setDragMode("rotation");
        setInitialRotation(activeLayer.rotation);
        setDragStart({ x, y });
        setIsDragging(true);
        return;
      }

      // Corner handle
      const corner = getCornerAtPoint(x, y);
      if (corner) {
        const box = getBoundingBox(activeLayer);
        if (!box) return;

        const idxMap: Record<string, number> = { tl: 0, tr: 1, br: 2, bl: 3 };
        const cornerIndex = idxMap[corner];
        const oppositeIndex = (cornerIndex + 2) % 4;
        const cornerPoint = box[cornerIndex];
        const anchor = box[oppositeIndex];

        setDragMode("corner");
        setDragCorner(corner);
        setInitialScale(activeLayer.scale);

        // Store both corner->anchor and corner->center distances so we can support toggling Shift mid-drag
        const distCornerAnchor = Math.hypot(cornerPoint.x - anchor.x, cornerPoint.y - anchor.y) || 1;
        const distCornerCenter = Math.hypot(cornerPoint.x - activeLayer.position.x, cornerPoint.y - activeLayer.position.y) || 1;

        setInitialCornerPoint({ x: cornerPoint.x, y: cornerPoint.y });
        setInitialAnchorPoint({ x: anchor.x, y: anchor.y });
        setInitialCenter({ x: activeLayer.position.x, y: activeLayer.position.y });
        setInitialDistCornerAnchor(distCornerAnchor);
        setInitialDistCornerCenter(distCornerCenter);

        setDragStart({ x, y });
        setIsDragging(true);
        return;
      }

      // Check if clicking inside the ACTIVE bounding box
      // If we are, we are dragging the active layer
      if (isInsideBoundingBox(activeLayer, x, y)) {
         setDragMode(null);
         setIsDragging(true);
         setDragStart({ x, y });
         setInitialDragPosition({ x: activeLayer.position.x, y: activeLayer.position.y });
         return;
      }

      // If we are here, we clicked OUTSIDE the active layer's controls
      // Check if we clicked ON TOP of another layer
      const clickedLayerId = getLayerAtPoint(x, y);
      if (clickedLayerId && clickedLayerId !== activeLayer.id) {
          // Fluid switching: Select the new layer
          onLayerSelection(clickedLayerId, e.shiftKey);
          
          // Note: we can't immediately drag the new layer because activeLayerId
          // is prop-driven and won't update until next render.
          // But we prevented deselecting.
          return;
      }

      // Clicked on empty space -> Exit transform mode
      onTransformModeExit();
      return;
    }

    // Not in transform mode OR no active layer (multi-select)
    // Check if clicking on any layer
    const clickedLayerId = getLayerAtPoint(x, y);
    if (clickedLayerId) {
      onLayerSelection(clickedLayerId, e.shiftKey);
      setDragMode(null);
      setIsDragging(true);
      setDragStart({ x, y });
      
      // Store initial position
      const clickedLayer = layers.find(l => l.id === clickedLayerId);
      if (clickedLayer) {
        setInitialDragPosition({ x: clickedLayer.position.x, y: clickedLayer.position.y });
      }
      return;
    }

    // Clicked empty space
    if (selectedLayerIds.length > 0) {
       onLayerSelection("", false); // Deselect all
       onTransformModeExit();
    }
  };

  // Mouse move: generalized to HTMLElement so can be attached to overlay/container
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!isDragging || !activeLayerPosition || !activeLayer) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    
    // Track that user has moved the mouse
    if (!hasDragged) {
      const distance = Math.hypot(x - dragStart.x, y - dragStart.y);
      if (distance > 3) { // 3px threshold to distinguish click from drag
        setHasDragged(true);
      }
    }

    if (dragMode === "rotation") {
      const centerX = activeLayerPosition.x;
      const centerY = activeLayerPosition.y;
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
      const startAngle = Math.atan2(dragStart.y - centerY, dragStart.x - centerX) * (180 / Math.PI);
      const deltaAngle = angle - startAngle;

      let newRotation = initialRotation + deltaAngle;
      while (newRotation > 180) newRotation -= 360;
      while (newRotation < -180) newRotation += 360;

      // Snap to 45-degree increments while Shift is held
      if (e.shiftKey) {
        newRotation = Math.round(newRotation / 45) * 45;
      }

      onRotationChange(Math.round(newRotation));
    } else if (dragMode === "corner") {
      // Determine whether scaling should be center-anchored (Shift) or opposite-corner anchored (default).
      if (e.shiftKey) {
        // Centre-anchored scaling (Shift): centre stays fixed, scale = initialScale * (currentDistanceCornerToCenter / initialDistCornerCenter)
        if (!initialCenter || !initialCornerPoint) return;
        const currentDist = Math.hypot(x - initialCenter.x, y - initialCenter.y);
        const ratio = initialDistCornerCenter > 0 ? currentDist / initialDistCornerCenter : 1;
        const newScale = Math.max(0.1, Math.min(3, initialScale * ratio));
        onScaleChange(parseFloat(newScale.toFixed(2)));
        // centre remains unchanged
      } else {
        // Opposite-corner anchored scaling: keep initialAnchor fixed and move center to keep anchor corner stable
        if (!initialAnchorPoint || !initialCenter || !initialCornerPoint) return;

        const currentDist = Math.hypot(x - initialAnchorPoint.x, y - initialAnchorPoint.y);
        const ratio = initialDistCornerAnchor > 0 ? currentDist / initialDistCornerAnchor : 1;
        const newScale = Math.max(0.1, Math.min(3, initialScale * ratio));

        // newCenter = anchor + (initialCenter - anchor) * ratio
        const newCenterX = initialAnchorPoint.x + (initialCenter.x - initialAnchorPoint.x) * ratio;
        const newCenterY = initialAnchorPoint.y + (initialCenter.y - initialAnchorPoint.y) * ratio;

        onScaleChange(parseFloat(newScale.toFixed(2)));
        onPositionChange({ x: parseFloat(newCenterX.toFixed(2)), y: parseFloat(newCenterY.toFixed(2)) });
      }
    } else {
      // Regular move dragging (translate)
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      // NEW: Shift-key constrained dragging along X or Y axis
      if (e.shiftKey && initialDragPosition) {
        // Calculate total delta from initial position
        const totalDeltaX = (activeLayerPosition.x + deltaX) - initialDragPosition.x;
        const totalDeltaY = (activeLayerPosition.y + deltaY) - initialDragPosition.y;
        
        // Constrain to axis with larger movement
        if (Math.abs(totalDeltaX) > Math.abs(totalDeltaY)) {
          // Horizontal movement only
          onPositionChange({
            x: activeLayerPosition.x + deltaX,
            y: initialDragPosition.y,
          });
        } else {
          // Vertical movement only
          onPositionChange({
            x: initialDragPosition.x,
            y: activeLayerPosition.y + deltaY,
          });
        }
      } else {
        // Normal unconstrained movement
        onPositionChange({
          x: activeLayerPosition.x + deltaX,
          y: activeLayerPosition.y + deltaY,
        });
      }
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    // NEW: If this was a click (not a drag) on the active layer, activate transform mode
    if (!hasDragged && isDragging && !dragMode && activeLayer && activeLayer.pattern === "none") {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const clickedLayerId = getLayerAtPoint(x, y);
      if (clickedLayerId === activeLayerId && !transformMode) {
        onTransformModeEnter();
      }
    }
    
    setIsDragging(false);
    setDragMode(null);
    setDragCorner(null);
    setInitialAnchorPoint(null);
    setInitialCornerPoint(null);
    setInitialCenter(null);
    setInitialDragPosition(null);
    setHasDragged(false);
  };

  // Render transform overlay and handles
  const renderTransformOverlay = () => {
    // If no layers selected, nothing to render
    if (selectedLayerIds.length === 0) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    const toScreen = (p: { x: number; y: number }) => ({ x: p.x * scaleX, y: p.y * scaleY });

    return (
      <div
        className="absolute inset-0 pointer-events-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="w-full h-full">
          {/* Render bounding box for ALL selected layers */}
          {selectedLayerIds.map((layerId) => {
             const layer = layers.find(l => l.id === layerId);
             if (!layer) return null;
             
             // Defensive: do not render overlay if the layer has a pattern applied
             if ((layer as any)?.pattern && (layer as any).pattern !== "none") return null;

             const box = getBoundingBox(layer);
             if (!box) return null;
             
             const screenBox = box.map(toScreen);
             
             const isPrimary = activeLayerId === layerId && transformMode;

             return (
              <Fragment key={layerId}>
                 <polygon
                    points={screenBox.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray={isPrimary ? "5,5" : "2,2"}
                    className={!isPrimary ? "opacity-60" : ""}
                  />
                  {/* Only render handles for the primary active layer in transform mode */}
                  {isPrimary && (
                    <>
                      {screenBox.map((pt, i) => {
                        const cursorClass = i === 0 || i === 2 ? "cursor-nwse-resize" : "cursor-nesw-resize";
                        return (
                          <rect
                            key={i}
                            x={pt.x - 6}
                            y={pt.y - 6}
                            width="12"
                            height="12"
                            fill="hsl(var(--background))"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            className={`pointer-events-auto ${cursorClass}`}
                          />
                        );
                      })}
                      {(() => {
                        const rotationHandle = { x: (screenBox[0].x + screenBox[1].x) / 2, y: (screenBox[0].y + screenBox[1].y) / 2 };
                        return (
                          <>
                            <circle
                              cx={rotationHandle.x}
                              cy={rotationHandle.y}
                              r="12"
                              fill="hsl(var(--background))"
                              stroke="hsl(var(--primary))"
                              strokeWidth="2"
                              className="pointer-events-auto cursor-grab"
                            />
                            <foreignObject x={rotationHandle.x - 8} y={rotationHandle.y - 8} width="16" height="16" className="pointer-events-none">
                              <RotateCw className="w-4 h-4 text-primary" />
                            </foreignObject>
                          </>
                        );
                      })()}
                    </>
                  )}
              </Fragment>
             );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className={`
          w-full h-full border border-border rounded-lg 
          ${!transformMode && activeLayerId ? "cursor-move" : transformMode ? "cursor-default" : "cursor-default"}
        `}
        style={{
          background: "transparent",
          backgroundImage:
            "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          display: "block",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {renderTransformOverlay()}
    </div>
  );
};

export default CanvasEditor;