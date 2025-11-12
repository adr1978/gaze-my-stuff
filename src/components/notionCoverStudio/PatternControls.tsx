import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Expand, X } from "lucide-react";

// This type can now be imported from src/types, but to minimize file changes,
// we can leave this component's local type definition.
export type PatternType = "none" | "grid" | "brick" | "diamonds" | "mirror" | "random" | "spread";

interface PatternControlsProps {
  pattern: PatternType;
  spacing: number;
  onPatternChange: (pattern: PatternType) => void;
  onSpacingChange: (spacing: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const PATTERNS = [
  { name: "Grid", value: "grid" as const },
  { name: "Brick", value: "brick" as const },
  { name: "Diamonds", value: "diamonds" as const },
  { name: "Mirror", value: "mirror" as const },
  { name: "Random", value: "random" as const },
  { name: "Spread", value: "spread" as const },
];

export const PatternControls = ({
  pattern,
  spacing,
  onPatternChange,
  onSpacingChange,
  onRemove,
  disabled = false,
}: PatternControlsProps) => {
  // Logic updated to use the 'pattern' prop
  const isSpacingDisabled = disabled || pattern === "none" || pattern === "random" || pattern === "spread";

  return (
    <Card className="p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Patterns</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={disabled || pattern === "none"}
            className=""
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>

        {/* Pattern Selection */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PATTERNS.map((p) => (
              <Button
                key={p.value}
                variant={pattern === p.value ? "default" : "outline"}
                onClick={() => onPatternChange(p.value)}
                disabled={disabled}
                className=""
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Spacing Control */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2">
            <Expand className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="spacing-slider" className="text-sm font-medium">
              Spacing: {spacing}px
            </Label>
          </div>
          <Slider
            id="spacing-slider"
            value={[spacing]}
            onValueChange={([value]) => onSpacingChange(value)}
            min={-50}
            max={200}
            step={5}
            disabled={isSpacingDisabled}
            className="cursor-pointer"
          />
        </div>
      </div>
    </Card>
  );
};