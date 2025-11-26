/**
 * Notion Cover Studio Page
 */

import { useState, useRef, useMemo, useEffect } from "react";
import { showToast } from "@/lib/toast-helper";
import { CanvasEditor } from "@/components/notionCoverStudio/CanvasEditor";
import { CanvasControls } from "@/components/notionCoverStudio/CanvasControls";
import { ImageControls } from "@/components/notionCoverStudio/ImageControls";
import { PatternControls, PatternType } from "@/components/notionCoverStudio/PatternControls";
import { getCanvasDimensions } from "@/components/notionCoverStudio/CanvasSizeConfig";
import { LayerState, RandomPatternData, LayerInitialState } from "@/types";
import { Card } from "@/components/ui/card";
import { LayerManager } from "@/components/notionCoverStudio/LayerManager";
import { AlignmentMenu } from "@/components/notionCoverStudio/AlignmentMenu";

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
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [transformMode, setTransformMode] = useState(false);
  
  // --- UNDO/REDO STATE ---
  const [history, setHistory] = useState<LayerState[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Capture initial state when layers are first added
  useEffect(() => {
    if (layers.length > 0 && history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(layers))]);
      setHistoryIndex(0);
    }
  }, [layers.length]);

  // --- LOGICAL CANVAS DIMENSIONS ---
  const logicalCanvasDimensions = useMemo(
    () => getCanvasDimensions(canvasSize),
    [canvasSize],
  );
  const CANVAS_WIDTH = logicalCanvasDimensions.width;
  const CANVAS_HEIGHT = logicalCanvasDimensions.height;

  // --- DERIVED STATE (Memoized) ---
  const activeLayerId = selectedLayerIds.length === 1 ? selectedLayerIds[0] : null;
  const activeLayer = useMemo(() => {
    return layers.find((l) => l.id === activeLayerId);
  }, [layers, activeLayerId]);
  const selectedLayers = useMemo(() => {
    return layers.filter((l) => selectedLayerIds.includes(l.id));
  }, [layers, selectedLayerIds]);

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
  const captureHistory = (newLayers: LayerState[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newLayers)));
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  const updateActiveLayer = (
    props: Partial<Omit<LayerState, "id" | "image" | "thumbnailUrl">>,
  ) => {
    if (!activeLayerId) return;

    setLayers((prevLayers) => {
      const newLayers = prevLayers.map((layer) =>
        layer.id === activeLayerId ? { ...layer, ...props } : layer,
      );
      captureHistory(newLayers);
      return newLayers;
    });
  };

  const updateSelectedLayers = (
    updateFn: (layer: LayerState) => Partial<Omit<LayerState, "id" | "image" | "thumbnailUrl">>
  ) => {
    if (selectedLayerIds.length === 0) return;

    setLayers((prevLayers) => {
      const newLayers = prevLayers.map((layer) =>
        selectedLayerIds.includes(layer.id) ? { ...layer, ...updateFn(layer) } : layer
      );
      captureHistory(newLayers);
      return newLayers;
    });
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
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check layer limits
    const availableSlots = MAX_LAYERS - layers.length;
    if (availableSlots <= 0) {
      showToast.error(`You have reached the maximum of ${MAX_LAYERS} layers`);
      e.target.value = "";
      return;
    }

    // Determine how many files we can actually accept
    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      showToast.warning(`Only adding ${availableSlots} files to fit limit`);
    }

    // Create a promise for each file to load and process
    const layerPromises = filesToProcess.map((file) => {
      return new Promise<LayerState | null>((resolve) => {
        if (!file.type.startsWith("image/")) {
          resolve(null); // Skip non-images
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

            // Store image in ref cache
            imageRefs.current[newLayerId] = img;

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
            resolve(newLayer);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all images to process
    const results = await Promise.all(layerPromises);
    const validNewLayers = results.filter((l): l is LayerState => l !== null);

    if (validNewLayers.length > 0) {
      setLayers((prevLayers) => {
        const newLayers = [...prevLayers, ...validNewLayers];
        captureHistory(newLayers);
        return newLayers;
      });
      // Select the newly added layers
      setSelectedLayerIds(validNewLayers.map((l) => l.id));
      setTransformMode(true);
      showToast.success(`Added ${validNewLayers.length} new layer(s)`);
    } else {
      showToast.error("No valid images were loaded");
    }

    e.target.value = "";
  };
  
  const handleRemoveLayer = (idToRemove: string) => {
    setLayers((prevLayers) => {
      const newLayers = prevLayers.filter((l) => l.id !== idToRemove);
      captureHistory(newLayers);

      if (selectedLayerIds.includes(idToRemove)) {
        const remainingSelected = selectedLayerIds.filter(id => id !== idToRemove);
        if (remainingSelected.length > 0) {
          setSelectedLayerIds(remainingSelected);
        } else if (newLayers.length > 0) {
          setSelectedLayerIds([newLayers[newLayers.length - 1].id]);
        } else {
          setSelectedLayerIds([]);
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
      const newLayers = prevLayers.map((layer) => ({
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
      captureHistory(newLayers);
      return newLayers;
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
    captureHistory(newLayers);
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const historicalLayers = history[newIndex];
      
      // Restore images from current layers
      const restoredLayers = historicalLayers.map(histLayer => {
        const currentLayer = layers.find(l => l.id === histLayer.id);
        return currentLayer ? { ...histLayer, image: currentLayer.image } : histLayer;
      });
      
      setLayers(restoredLayers);
      showToast.success("Undo");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const historicalLayers = history[newIndex];
      
      // Restore images from current layers
      const restoredLayers = historicalLayers.map(histLayer => {
        const currentLayer = layers.find(l => l.id === histLayer.id);
        return currentLayer ? { ...histLayer, image: currentLayer.image } : histLayer;
      });
      
      setLayers(restoredLayers);
      showToast.success("Redo");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } 
      // Select All
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        // Select all layers
        setSelectedLayerIds(layers.map(l => l.id));
        showToast.info(`Selected ${layers.length} layers`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, layers]);

  // Toggle layer selection with shift
  const handleLayerSelection = (layerId: string, shiftKey: boolean) => {
    if (shiftKey) {
      setSelectedLayerIds(prev => 
        prev.includes(layerId) 
          ? prev.filter(id => id !== layerId)
          : [...prev, layerId]
      );
    } else {
      setSelectedLayerIds([layerId]);
    }
  };

  // --- ALIGNMENT HELPERS ---
  
  // Scans image data to find the bounding box of non-transparent pixels (alpha > 0)
  const getImageContentBounds = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { x: 0, y: 0, w: img.width, h: img.height };
    
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    
    let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
    let found = false;
    
    // Check every pixel's alpha channel (every 4th byte)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) { // If not transparent
        const idx = i / 4;
        const x = idx % img.width;
        const y = Math.floor(idx / img.width);
        
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
    
    if (!found) return { x: 0, y: 0, w: img.width, h: img.height }; // If fully transparent or empty
    
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  };

  // Computes the global (canvas) coordinates of the visual content
  // accounting for scale, rotation, and transparency trimming.
  const getVisualBounds = (layer: LayerState) => {
    const content = getImageContentBounds(layer.image);
    
    // Corners of the non-transparent content rectangle in local image space
    // content.x/y is relative to the top-left of the image source
    const corners = [
      { x: content.x, y: content.y },
      { x: content.x + content.w, y: content.y },
      { x: content.x + content.w, y: content.y + content.h },
      { x: content.x, y: content.y + content.h }
    ];
    
    // Image center in local space
    const imgCX = layer.image.width / 2;
    const imgCY = layer.image.height / 2;
    
    const rad = (layer.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Transform corners to global canvas space
    const globalCorners = corners.map(p => {
      // 1. Shift to center origin
      const lx = (p.x - imgCX) * layer.scale;
      const ly = (p.y - imgCY) * layer.scale;
      
      // 2. Rotate
      const rx = lx * cos - ly * sin;
      const ry = lx * sin + ly * cos;
      
      // 3. Translate to layer position
      return {
        x: rx + layer.position.x,
        y: ry + layer.position.y
      };
    });
    
    const xs = globalCorners.map(p => p.x);
    const ys = globalCorners.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  // Alignment handler for multiple layers
  const handleAlign = (type: 'left' | 'right' | 'centerH' | 'top' | 'bottom' | 'centerV' | 'distributeH' | 'distributeV') => {
    if (selectedLayerIds.length < 2) return;

    // Calculate visual bounds for all selected layers once
    const boundsMap = new Map();
    const selectedLayersList = layers.filter(l => selectedLayerIds.includes(l.id));
    
    selectedLayersList.forEach(l => {
      boundsMap.set(l.id, getVisualBounds(l));
    });

    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      
      if (type === 'left') {
        // Find the left-most edge among all visual bounds
        const targetX = Math.min(...selectedLayersList.map(l => boundsMap.get(l.id).minX));
        
        selectedLayersList.forEach(l => {
          const layer = newLayers.find(nl => nl.id === l.id);
          const bounds = boundsMap.get(l.id);
          // Delta needed to move this layer's visual left edge to targetX
          const delta = targetX - bounds.minX;
          if (layer) layer.position.x += delta;
        });
      } else if (type === 'right') {
        const targetX = Math.max(...selectedLayersList.map(l => boundsMap.get(l.id).maxX));
        
        selectedLayersList.forEach(l => {
          const layer = newLayers.find(nl => nl.id === l.id);
          const bounds = boundsMap.get(l.id);
          const delta = targetX - bounds.maxX;
          if (layer) layer.position.x += delta;
        });
      } else if (type === 'centerH') {
        const avgX = selectedLayersList.reduce((sum, l) => sum + boundsMap.get(l.id).centerX, 0) / selectedLayersList.length;
        
        selectedLayersList.forEach(l => {
          const layer = newLayers.find(nl => nl.id === l.id);
          const bounds = boundsMap.get(l.id);
          const delta = avgX - bounds.centerX;
          if (layer) layer.position.x += delta;
        });
      } else if (type === 'top') {
        const targetY = Math.min(...selectedLayersList.map(l => boundsMap.get(l.id).minY));
        
        selectedLayersList.forEach(l => {
          const layer = newLayers.find(nl => nl.id === l.id);
          const bounds = boundsMap.get(l.id);
          const delta = targetY - bounds.minY;
          if (layer) layer.position.y += delta;
        });
      } else if (type === 'bottom') {
        const targetY = Math.max(...selectedLayersList.map(l => boundsMap.get(l.id).maxY));
        
        selectedLayersList.forEach(l => {
          const layer = newLayers.find(nl => nl.id === l.id);
          const bounds = boundsMap.get(l.id);
          const delta = targetY - bounds.maxY;
          if (layer) layer.position.y += delta;
        });
      } else if (type === 'centerV') {
        const avgY = selectedLayersList.reduce((sum, l) => sum + boundsMap.get(l.id).centerY, 0) / selectedLayersList.length;
        
        selectedLayersList.forEach(l => {
          const layer = newLayers.find(nl => nl.id === l.id);
          const bounds = boundsMap.get(l.id);
          const delta = avgY - bounds.centerY;
          if (layer) layer.position.y += delta;
        });
      } else if (type === 'distributeH') {
        // Sort by visual center X
        const sorted = [...selectedLayersList].sort((a, b) => boundsMap.get(a.id).centerX - boundsMap.get(b.id).centerX);
        
        if (sorted.length > 1) {
          const leftMost = boundsMap.get(sorted[0].id).centerX;
          const rightMost = boundsMap.get(sorted[sorted.length - 1].id).centerX;
          const gap = (rightMost - leftMost) / (sorted.length - 1);
          
          sorted.forEach((l, i) => {
            const layer = newLayers.find(nl => nl.id === l.id);
            const bounds = boundsMap.get(l.id);
            const targetCenter = leftMost + gap * i;
            const delta = targetCenter - bounds.centerX;
            if (layer) layer.position.x += delta;
          });
        }
      } else if (type === 'distributeV') {
        // Sort by visual center Y
        const sorted = [...selectedLayersList].sort((a, b) => boundsMap.get(a.id).centerY - boundsMap.get(b.id).centerY);
        
        if (sorted.length > 1) {
          const topMost = boundsMap.get(sorted[0].id).centerY;
          const bottomMost = boundsMap.get(sorted[sorted.length - 1].id).centerY;
          const gap = (bottomMost - topMost) / (sorted.length - 1);
          
          sorted.forEach((l, i) => {
            const layer = newLayers.find(nl => nl.id === l.id);
            const bounds = boundsMap.get(l.id);
            const targetCenter = topMost + gap * i;
            const delta = targetCenter - bounds.centerY;
            if (layer) layer.position.y += delta;
          });
        }
      }

      captureHistory(newLayers);
      return newLayers;
    });

    showToast.success(`Layers aligned: ${type}`);
  };

  const isLayerActive = !!activeLayer;
  const isExportDisabled = layers.length === 0 && backgroundColor === "transparent";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2">Notion Cover Studio v4</h1>
        <p className="text-muted-foreground mb-6">Design beautiful Notion cover images with ease.  Upload and manipulate up to five images.</p>

        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          multiple
          onChange={handleFileUpload} 
          className="hidden" 
        />

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
              {/* Alignment Menu for multi-select */}
              {selectedLayerIds.length > 1 && (
                <AlignmentMenu onAlign={handleAlign} />
              )}
              
              <CanvasEditor
                layers={layers}
                backgroundColor={backgroundColor}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                selectedLayerIds={selectedLayerIds}
                onPositionChange={(newPosition) => {
                  if (selectedLayerIds.length === 1) {
                    updateActiveLayer({ position: newPosition });
                  } else {
                    // Multi-layer drag not yet implemented
                  }
                }}
                transformMode={transformMode}
                onTransformModeExit={() => setTransformMode(false)}
                onTransformModeEnter={() => setTransformMode(true)}
                onScaleChange={(scale) => updateActiveLayer({ scale })}
                onRotationChange={(rotation) => updateActiveLayer({ rotation })}
                onLayerSelection={handleLayerSelection}
              />
            </div>

            <LayerManager
              layers={layers}
              selectedLayerIds={selectedLayerIds}
              onSelectLayer={handleLayerSelection}
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