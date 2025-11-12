import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: "png" | "jpg", quality: number) => void;
}

export const ExportDialog = ({ open, onOpenChange, onExport }: ExportDialogProps) => {
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [quality, setQuality] = useState(0.95);

  const handleExport = () => {
    onExport(format, quality);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Notion Cover</DialogTitle>
          <DialogDescription>
            Configure your export settings and download your custom Notion cover.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as "png" | "jpg")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="format-png" />
                <Label htmlFor="format-png" className="font-normal cursor-pointer">
                  PNG - Lossless, supports transparency
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jpg" id="format-jpg" />
                <Label htmlFor="format-jpg" className="font-normal cursor-pointer">
                  JPG - Smaller file size
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quality Slider */}
          {format === "jpg" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Quality</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([value]) => setQuality(value)}
                min={0.1}
                max={1}
                step={0.05}
                className="cursor-pointer"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button onClick={handleExport} className="rounded-full">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
