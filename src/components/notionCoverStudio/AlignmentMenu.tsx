import { Button } from "@/components/ui/button";
import { 
  AlignLeft, 
  AlignRight, 
  AlignHorizontalJustifyCenter,
  AlignStartVertical, 
  AlignEndVertical, 
  AlignVerticalJustifyCenter,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround
} from "lucide-react";

interface AlignmentMenuProps {
  onAlign: (type: 'left' | 'right' | 'centerH' | 'top' | 'bottom' | 'centerV' | 'distributeH' | 'distributeV') => void;
}

export function AlignmentMenu({ onAlign }: AlignmentMenuProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2 flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onAlign('left')}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onAlign('centerH')}
        title="Center Horizontally"
      >
        <AlignHorizontalJustifyCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onAlign('right')}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onAlign('top')}
        title="Align Top"
      >
        <AlignStartVertical className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onAlign('centerV')}
        title="Center Vertically"
      >
        <AlignVerticalJustifyCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onAlign('bottom')}
        title="Align Bottom"
      >
        <AlignEndVertical className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onAlign('distributeH')}
        title="Distribute Horizontally"
      >
        <AlignHorizontalSpaceAround className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onAlign('distributeV')}
        title="Distribute Vertically"
      >
        <AlignVerticalSpaceAround className="h-4 w-4" />
      </Button>
    </div>
  );
}

