import { LayerState } from "@/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LayerManagerProps {
  layers: LayerState[];
  selectedLayerIds: string[];
  onSelectLayer: (id: string, shiftKey: boolean) => void;
  onRemoveLayer: (id: string) => void;
  onSetLayers: (layers: LayerState[]) => void;
  className?: string;
}

export const LayerManager = ({
  layers,
  selectedLayerIds,
  onSelectLayer,
  onRemoveLayer,
  onSetLayers,
  className,
}: LayerManagerProps) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // MODIFIED: Changed from (layers.length <= 1) to (layers.length === 0)
  if (layers.length === 0) {
    return null;
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const currentList = [...layers].reverse();
    const draggedIndex = currentList.findIndex((l) => l.id === draggedId);
    const targetIndex = currentList.findIndex((l) => l.id === targetId);

    const newList = [...currentList];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, draggedItem);

    onSetLayers(newList.reverse());
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    // Apply positioning classes passed from Index.tsx
    <div className={cn("flex flex-col gap-2", className)}>
      {[...layers].reverse().map((layer) => (
        <div
          key={layer.id}
          className="relative"
          draggable="true"
          onDragStart={(e) => handleDragStart(e, layer.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, layer.id)}
          onDragEnd={handleDragEnd}
        >
          <button
            type="button"
            onClick={(e) => onSelectLayer(layer.id, e.shiftKey)}
            className={cn(
              `
              w-16 h-16 rounded-lg transition-all p-1 bg-background/80 backdrop-blur-sm
              cursor-grab active:cursor-grabbing
              hover:scale-105 hover:shadow-xl
            `,
              selectedLayerIds.includes(layer.id)
                ? "scale-105 shadow-2xl ring-2 ring-primary"
                : "shadow-md ring-2 ring-slate-400",

              draggedId === layer.id ? "opacity-50" : "",
            )}
            title={`Select layer (Shift+Click for multi-select, Drag to reorder)`}
          >
            <div
              className="w-full h-full rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${layer.thumbnailUrl})` }}
            />
          </button>
          <Button
            variant="destructive"
            size="icon"
            // This positioning is now relative to the thumbnail button
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveLayer(layer.id);
            }}
            title="Remove layer"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};