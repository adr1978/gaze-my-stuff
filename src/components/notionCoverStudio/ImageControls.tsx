import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCw, Maximize2, Droplet, RotateCcw, Magnet, VectorSquare } from "lucide-react";

interface ImageControlsProps {
  scale: number;
  rotation: number;
  opacity: number;
  onScaleChange: (value: number) => void;
  onRotationChange: (value: number) => void;
  onOpacityChange: (value: number) => void;
  onReset: () => void;
  onSnapToCenter: () => void;
  onToggleTransform: () => void;
  transformMode: boolean;
  isPatternActive: boolean;
  disabled?: boolean;
  isAtDefaultState: boolean; // NEW: Prop to check if state is default
}

export const ImageControls = ({
  scale,
  rotation,
  opacity,
  onScaleChange,
  onRotationChange,
  onOpacityChange,
  onReset,
  onSnapToCenter,
  onToggleTransform,
  transformMode,
  isPatternActive,
  disabled = false,
  isAtDefaultState, // NEW
}: ImageControlsProps) => {
  return (
    <Card className="p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Image Controls</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={disabled || isAtDefaultState} // MODIFIED: Disable if at default
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Scale Control */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="scale-slider" className="text-sm font-medium">
              Scale: {scale.toFixed(2)}x
            </Label>
          </div>
          <Slider
            id="scale-slider"
            value={[scale]}
            onValueChange={([value]) => onScaleChange(value)}
            min={0.1}
            max={3}
            step={0.01}
            disabled={disabled}
            className="cursor-pointer"
          />
        </div>

        {/* Rotation Control */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <RotateCw className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="rotation-slider" className="text-sm font-medium">
              Rotation: {rotation}°
            </Label>
          </div>
          <Slider
            id="rotation-slider"
            value={[rotation]}
            onValueChange={([value]) => onRotationChange(value)}
            min={-180}
            max={180}
            step={1}
            disabled={disabled}
            className="cursor-pointer"
          />
        </div>

        {/* Opacity Control */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="opacity-slider" className="text-sm font-medium">
              Opacity: {Math.round(opacity * 100)}%
            </Label>
          </div>
          <Slider
            id="opacity-slider"
            value={[opacity]}
            onValueChange={([value]) => onOpacityChange(value)}
            min={0}
            max={1}
            step={0.01}
            disabled={disabled}
            className="cursor-pointer"
          />
        </div>

        {/* Snap to Centre & Transform */}
        <div className="pt-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSnapToCenter}
            disabled={isPatternActive || disabled}
            className="flex-1"
          >
            <Magnet className="h-4 w-4 mr-2" />
            Snap to Centre
          </Button>
          <Button
            variant={transformMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleTransform}
            disabled={isPatternActive || disabled} // UPDATED: also disable Transform when a pattern is active (same behaviour as Snap to Centre)
            className="flex-1"
          >
            <VectorSquare className="h-4 w-4 mr-2" />
            Transform
          </Button>
        </div>
      </div>
    </Card>
  );
};