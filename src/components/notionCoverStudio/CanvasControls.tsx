import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Eraser, Upload, Download, CheckCircle2 } from "lucide-react"; 
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CanvasControlsProps {
  canvasSize: string;
  onCanvasSizeChange: (size: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  outputQuality: number;
  onOutputQualityChange: (quality: number) => void;
  outputFormat: "png" | "jpg";
  onOutputFormatChange: (format: "png" | "jpg") => void;
  onUploadClick: () => void;
  onExportClick: () => void;
  isExportDisabled: boolean;
  layerCount: number;
  maxLayers: number; 
}

// Colour swatch options
const presetColors = [
  { name: "White", value: "#FFFFFF" },
  { name: "Light Grey", value: "#F5F5F5" },
  { name: "Medium Grey", value: "#D1D5DB" },
  { name: "Grey", value: "#9CA3AF" },
  { name: "Dark Grey", value: "#374151" },
  { name: "Charcoal", value: "#1F2937" },
  { name: "Black", value: "#000000" },
  { name: "Sky Blue", value: "#0EA5E9" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Lime", value: "#84CC16" },
  { name: "Green", value: "#10B981" },
  { name: "Emerald", value: "#059669" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Beige", value: "#D4C5B9" },
  { name: "Warm Beige", value: "#C4A484" },
];

export const CanvasControls = ({
  canvasSize,
  onCanvasSizeChange,
  backgroundColor,
  onBackgroundColorChange,
  outputQuality,
  onOutputQualityChange,
  outputFormat,
  onOutputFormatChange,
  onUploadClick,
  onExportClick,
  isExportDisabled,
  layerCount,
  maxLayers,
}: CanvasControlsProps) => {
  const hasNoBackground = !backgroundColor || backgroundColor === "transparent";
  const [hexInput, setHexInput] = useState(hasNoBackground ? "#FFFFFF" : backgroundColor);

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    const hexRegex = /^#?([A-Fa-f0-9]{6})$/;
    const match = value.match(hexRegex);
    if (match) {
      const hexColor = `#${match[1]}`;
      onBackgroundColorChange(hexColor);
    }
  };

  const isUploadDisabled = layerCount >= maxLayers;

  return (
    <Card className="p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Canvas Controls</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="canvas-size" className="text-sm font-medium">
              Canvas Size
            </Label>
            <Select value={canvasSize} onValueChange={onCanvasSizeChange}>
              <SelectTrigger id="canvas-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notion">Notion Cover</SelectItem>
                <SelectItem value="16:9">Wide (16:9)</SelectItem>
                <SelectItem value="4:3">Classic (4:3)</SelectItem>
                <SelectItem value="3:2">Photo (3:2)</SelectItem>
                <SelectItem value="1:1">Square (1:1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Background Colour</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                      className={`w-9 h-9 rounded-lg border-2 transition-colors flex-shrink-0 ${
                      hasNoBackground
                        ? "border-dashed border-border bg-transparent"
                        : "border-border"
                    }`}
                    style={{
                      backgroundColor: hasNoBackground ? "transparent" : backgroundColor,
                    }}
                    title="Select background colour"
                  />
                </PopoverTrigger>
                <PopoverContent className="w-96" align="start">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Preset Colours</Label>
                      <div className="grid grid-cols-8 gap-2">
                        {presetColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => {
                              onBackgroundColorChange(color.value);
                              setHexInput(color.value);
                            }}
                            className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                              backgroundColor === color.value
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-border"
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={`${color.name}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium block">
                        Custom Colour
                      </Label>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg border-2 border-border flex-shrink-0 relative overflow-hidden"
                          style={{ 
                            backgroundColor: hasNoBackground ? "transparent" : backgroundColor 
                          }}
                        >
                          <input
                            id="custom-color"
                            type="color"
                            value={hasNoBackground ? "#FFFFFF" : backgroundColor}
                            onChange={(e) => {
                              onBackgroundColorChange(e.target.value);
                              setHexInput(e.target.value);
                            }}
                            className="absolute inset-0 w-full h-full cursor-pointer border-0 opacity-0"
                            style={{ padding: 0, margin: 0 }}
                          />
                        </div>
                        <Input
                          type="text"
                          value={hexInput}
                          onChange={(e) => handleHexInputChange(e.target.value)}
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onBackgroundColorChange("transparent");
                  setHexInput("#FFFFFF");
                  toast.success("Background colour cleared", { 
                    icon: <CheckCircle2 className="h-5 w-5 text-green-400" /> 
                  });
                }}
                className=""
                disabled={hasNoBackground}
              >
                <Eraser className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="output-quality" className="text-sm font-medium">
              Output Quality
            </Label>
            <Select 
              value={outputQuality.toString()} 
              onValueChange={(value) => onOutputQualityChange(Number(value))}
            >
              <SelectTrigger id="output-quality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Standard (1x)</SelectItem>
                <SelectItem value="2">High (2x)</SelectItem>
                <SelectItem value="3">Ultra (3x)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="output-format" className="text-sm font-medium">
              Output Format
            </Label>
            <Select 
              value={outputFormat} 
              onValueChange={(value) => onOutputFormatChange(value as "png" | "jpg")}
            >
              <SelectTrigger id="output-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Upload & Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild className="w-full">
                  {/* Wrap button in a span for tooltip to work when disabled */}
                  <span className="inline-block w-full">
                    <Button
                      onClick={onUploadClick}
                      className="w-full"
                      disabled={isUploadDisabled}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </span>
                </TooltipTrigger>
                {isUploadDisabled && (
                  <TooltipContent>
                    <p>You have reached the maximum of {maxLayers} layers.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-2">
            <Button
              onClick={onExportClick}
              className="w-full"
              disabled={isExportDisabled}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Cover
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};