import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { designGuideContent } from "./DesignGuideContent";

interface DesignGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DesignGuideDialog = ({ open, onOpenChange }: DesignGuideDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Design & Feature Documentation</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 text-sm leading-relaxed pb-6">
            <div dangerouslySetInnerHTML={{ __html: designGuideContent }} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
