/**
 * Notion Cover Studio Page
 * 
 * Placeholder page for the Notion Cover Studio feature.
 * This page will be developed to provide tools for creating
 * and managing Notion cover images.
 */

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
} from "lucide-react";
import { showToast } from "@/lib/toast-helper";
import { CanvasEditor } from "@/components/notionCoverStudio/CanvasEditor";
import { CanvasControls } from "@/components/notionCoverStudio/CanvasControls";
import { ImageControls } from "@/components/notionCoverStudio/ImageControls";
import { PatternControls, PatternType } from "@/components/notionCoverStudio/PatternControls";
import { getCanvasDimensions } from "@/components/notionCoverStudio/CanvasSizeConfig";
import { LayerState, RandomPatternData, LayerInitialState } from "@/types"; // Import new type
import { Card } from "@/components/ui/card";
import { LayerManager } from "@/components/notionCoverStudio/LayerManager"; // Import LayerManager

const MAX_LAYERS = 5;
// Set max display height to the Notion Cover height
const MAX_DISPLAY_HEIGHT = getCanvasDimensions("notion").height; // 600px

const Index = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- GLOBAL STATE ---
  const [backgroundColor, setBackgroundColor] = useState<string>("transparent");
  const [canvasSize, setCanvasSize] = useState<string>("notion");
  const [outputQuality, setOutputQuality] = useState(1);
  const [outputFormat, setOutputFormat] = useState<"png" | "jpg">("png");

  // --- LAYER STATE ---
  const [layers, setLayers] = useState<LayerState[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState(false);

  // --- LOGICAL CANVAS DIMENSIONS ---
  const logicalCanvasDimensions = useMemo(
    () => getCanvasDimensions(canvasSize),
    [canvasSize],
  );
  const CANVAS_WIDTH = logicalCanvasDimensions.width;
  const CANVAS_HEIGHT = logicalCanvasDimensions.height;

  // --- DERIVED STATE (Memoized) ---
  const activeLayer = useMemo(() => {
    return layers.find((l) => l.id === activeLayerId);
  }, [layers, activeLayerId]);

  // NEW: Check if the active layer is at its initial state
  const isAtDefaultState = useMemo(() => {
    if (!activeLayer) return true;
    const { initialState } = activeLayer;
    return (
      activeLayer.scale === initialState.scale &&
      activeLayer.rotation === initialState.rotation &&
      activeLayer.opacity === initialState.opacity &&
      activeLayer.position.x === initialState.position.x &&
      activeLayer.position.y === initialState.position.y
    );
  }, [activeLayer]);

  // --- HELPER FUNCTIONS ---
  const updateActiveLayer = (
    props: Partial<Omit<LayerState, "id" | "image" | "thumbnailUrl">>,
  ) => {
    if (!activeLayerId) return;

    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === activeLayerId ? { ...layer, ...props } : layer,
      ),
    );
  };

  const generateRandomPatternData = (
    image: HTMLImageElement,
    basePattern: PatternType,
    baseScale: number,
    baseRotation: number,
    baseSpacing: number,
  ) => {
    if (basePattern !== "random" && basePattern !== "spread") {
      return [];
    }

    const scaledWidth = image.width * baseScale;
    const scaledHeight = image.height * baseScale;
    const stepX = scaledWidth + baseSpacing;
    const stepY = scaledHeight + baseSpacing;

    const cols = Math.ceil(CANVAS_WIDTH / stepX) + 2;
    const rows = Math.ceil(CANVAS_HEIGHT / stepY) + 2;
    const count = Math.max(cols * rows, 50);

    const newData: RandomPatternData[] = [];
    for (let i = 0; i < count; i++) {
      const randX =
        -scaledWidth + Math.random() * (CANVAS_WIDTH + 2 * scaledWidth);
      const randY =
        -scaledHeight + Math.random() * (CANVAS_HEIGHT + 2 * scaledHeight);

      let rotationJitter = 0;
      let scaleJitter = 1;

      if (basePattern === "spread") {
        rotationJitter = Math.random() * 70 - 35;
        scaleJitter = 0.85 + Math.random() * 0.3;
      } else if (basePattern === "random") {
        rotationJitter = Math.random() * 360;
        scaleJitter = 1;
      }

      newData.push({ x: randX, y: randY, rotationJitter, scaleJitter });
    }
    return newData;
  };

  const createThumbnail = (image: HTMLImageElement): string => {
    const thumbCanvas = document.createElement("canvas");
    const size = 128;
    thumbCanvas.width = size;
    thumbCanvas.height = size;
    const ctx = thumbCanvas.getContext("2d");
    if (!ctx) return "";

    const hRatio = size / image.width;
    const vRatio = size / image.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (size - image.width * ratio) / 2;
    const centerShiftY = (size - image.height * ratio) / 2;

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      centerShiftX,
      centerShiftY,
      image.width * ratio,
      image.height * ratio,
    );

    return thumbCanvas.toDataURL("image/png");
  };

  // --- EVENT HANDLERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (layers.length >= MAX_LAYERS) {
      showToast.error(`You can only add up to ${MAX_LAYERS} layers`);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Please upload a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scaleX = CANVAS_WIDTH / img.width;
        const scaleY = CANVAS_HEIGHT / img.height;
        const initialScale = Math.min(scaleX, scaleY, 1);
        const newLayerId = crypto.randomUUID();
        const thumbnailUrl = createThumbnail(img);

        const initialState: LayerInitialState = {
          scale: initialScale,
          rotation: 0,
          opacity: 1,
          position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
        };

        const newLayer: LayerState = {
          id: newLayerId,
          image: img,
          thumbnailUrl: thumbnailUrl,
          ...initialState,
          pattern: "none",
          spacing: 20,
          randomPatternData: [],
          initialState: initialState,
        };

        setLayers((prevLayers) => [...prevLayers, newLayer]);
        setActiveLayerId(newLayerId);

        // NEW: enable transform mode automatically for newly added images
        setTransformMode(true);

        showToast.success("Image uploaded as new layer");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleRemoveLayer = (idToRemove: string) => {
    setLayers((prevLayers) => {
      const newLayers = prevLayers.filter((l) => l.id !== idToRemove);

      if (activeLayerId === idToRemove) {
        if (newLayers.length > 0) {
          setActiveLayerId(newLayers[newLayers.length - 1].id);
        } else {
          setActiveLayerId(null);
        }
      }
      return newLayers;
    });

    showToast.success("Layer removed");
  };

  const handleResetImage = () => {
    if (!activeLayer) return;

    updateActiveLayer({
      ...activeLayer.initialState,
    });

    showToast.success("Active layer reset");
  };

  const handleRemovePattern = () => {
    updateActiveLayer({ pattern: "none", randomPatternData: [] });
    showToast.success("Pattern removed from active layer");
  };

  const handleSnapToGrid = () => {
    updateActiveLayer({
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    });
    showToast.success("Active layer centred");
  };

  const handleToggleTransform = () => {
    setTransformMode((prev) => !prev);
  };

  const handleCanvasSizeChange = (newSize: string) => {
    setCanvasSize(newSize);
    const newDimensions = getCanvasDimensions(newSize);

    setLayers((prevLayers) => {
      return prevLayers.map((layer) => ({
        ...layer,
        position: { x: newDimensions.width / 2, y: newDimensions.height / 2 },
        initialState: {
          ...layer.initialState,
          position: { x: newDimensions.width / 2, y: newDimensions.height / 2 },
        },
        randomPatternData: generateRandomPatternData(
          layer.image,
          layer.pattern,
          layer.scale,
          layer.rotation,
          layer.spacing,
        ),
      }));
    });

    showToast.success("Canvas size updated");
  };

  const handlePatternChange = (newPattern: PatternType) => {
    if (!activeLayer) return;

    let newPatternData: RandomPatternData[] = [];
    if (newPattern === "random" || newPattern === "spread") {
      newPatternData = generateRandomPatternData(
        activeLayer.image,
        newPattern,
        activeLayer.scale,
        activeLayer.rotation,
        activeLayer.spacing,
      );
      showToast.info("Spacing is disabled for this pattern");
    }

    updateActiveLayer({
      pattern: newPattern,
      randomPatternData: newPatternData,
      position: {
        x: 10 + (activeLayer.image.width * activeLayer.scale) / 2,
        y: 10 + (activeLayer.image.height * activeLayer.scale) / 2,
      },
    });
  };

  const handleSpacingChange = (newSpacing: number) => {
    if (!activeLayer) return;

    let newPatternData = activeLayer.randomPatternData;
    if (activeLayer.pattern === "random" || activeLayer.pattern === "spread") {
      newPatternData = generateRandomPatternData(
        activeLayer.image,
        activeLayer.pattern,
        activeLayer.scale,
        activeLayer.rotation,
        newSpacing,
      );
    }
    updateActiveLayer({
      spacing: newSpacing,
      randomPatternData: newPatternData,
    });
  };

  const handleExportClick = async () => {
    const exportCanvas = document.createElement("canvas");
    const exportWidth = CANVAS_WIDTH * outputQuality;
    const exportHeight = CANVAS_HEIGHT * outputQuality;
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(outputQuality, outputQuality);

    if (backgroundColor && backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    for (const layer of layers) {
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
          for (let y = -scaledHeight; y < CANVAS_HEIGHT + scaledHeight; y += stepY) {
            for (let x = -scaledWidth; x < CANVAS_WIDTH + scaledWidth; x += stepX) {
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

    const mimeType = outputFormat === "png" ? "image/png" : "image/jpeg";
    const jpgQuality = 0.95;
    const dataUrl = exportCanvas.toDataURL(mimeType, jpgQuality);

    const link = document.createElement("a");
    link.download = `notion-cover-${Date.now()}.${outputFormat}`;
    link.href = dataUrl;
    link.click();
  };

  // Handler for drag-and-drop reordering
  const handleSetLayers = (newLayers: LayerState[]) => {
    setLayers(newLayers);
  };

  const isLayerActive = !!activeLayer;
  const isExportDisabled = layers.length === 0 && backgroundColor === "transparent";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2">Notion Cover Studio</h1>
        <p className="text-muted-foreground mb-6">Design beautiful Notion cover images with ease.  Upload and manipulate up to five images.</p>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

        {/* --- MODIFIED CANVAS/LAYER AREA --- */}
        <div className="w-full flex justify-center pb-6">
          <Card className="p-6 shadow-sm w-full relative">
            <div
              className="relative mx-auto"
              style={{
                aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                maxHeight: `${MAX_DISPLAY_HEIGHT}px`,
                maxWidth: "100%",
              }}
            >
              <CanvasEditor
                layers={layers}
                backgroundColor={backgroundColor}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                activeLayerId={activeLayerId}
                onPositionChange={(newPosition) => updateActiveLayer({ position: newPosition })}
                transformMode={transformMode}
                onTransformModeExit={() => setTransformMode(false)}
                onTransformModeEnter={() => setTransformMode(true)}
                onScaleChange={(scale) => updateActiveLayer({ scale })}
                onRotationChange={(rotation) => updateActiveLayer({ rotation })}
                onActiveLayerChange={setActiveLayerId}
              />
            </div>

            <LayerManager
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
              onRemoveLayer={handleRemoveLayer}
              onSetLayers={handleSetLayers}
              className="absolute top-6 right-6 z-10 flex flex-col gap-2"
            />
          </Card>
        </div>
        {/* --- END MODIFIED AREA --- */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CanvasControls
            canvasSize={canvasSize}
            onCanvasSizeChange={handleCanvasSizeChange}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            outputQuality={outputQuality}
            onOutputQualityChange={setOutputQuality}
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            onUploadClick={() => fileInputRef.current?.click()}
            onExportClick={handleExportClick}
            isExportDisabled={isExportDisabled}
            layerCount={layers.length}
            maxLayers={MAX_LAYERS}
          />
          <PatternControls
            pattern={activeLayer?.pattern ?? "none"}
            spacing={activeLayer?.spacing ?? 20}
            onPatternChange={handlePatternChange}
            onSpacingChange={handleSpacingChange}
            onRemove={handleRemovePattern}
            disabled={!isLayerActive}
          />
          <ImageControls
            scale={activeLayer?.scale ?? 1}
            rotation={activeLayer?.rotation ?? 0}
            opacity={activeLayer?.opacity ?? 1}
            onScaleChange={(scale) => updateActiveLayer({ scale })}
            onRotationChange={(rotation) => updateActiveLayer({ rotation })}
            onOpacityChange={(opacity) => updateActiveLayer({ opacity })}
            onReset={handleResetImage}
            onSnapToCenter={handleSnapToGrid}
            onToggleTransform={handleToggleTransform}
            transformMode={transformMode}
            isPatternActive={activeLayer?.pattern !== "none"}
            disabled={!isLayerActive}
            isAtDefaultState={isAtDefaultState}
          />
        </div>

      </div>
    </div>
  );
};

export default Index;