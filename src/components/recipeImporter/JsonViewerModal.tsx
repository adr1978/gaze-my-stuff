/**
 * JsonViewerModal Component
 * 
 * Displays recipe data as formatted, syntax-highlighted JSON.
 * Features:
 * - Fullscreen toggle for better viewing of large JSON
 * - Syntax highlighting using react-syntax-highlighter
 * - Horizontal scrolling for long lines
 * - Fixed header/footer with scrollable code content
 * 
 * Props:
 * - isOpen: Controls modal visibility
 * - onOpenChange: Callback when modal should close
 * - recipeData: Recipe data to display
 * - metadata: Additional metadata (source, category)
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { atelierCaveLight, atelierCaveDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Expand, Shrink } from "lucide-react";
import { useTheme } from "next-themes";

// Register JSON language support for syntax highlighting
SyntaxHighlighter.registerLanguage('json', json);

interface RecipeData {
  name: string | null;
  url: string | null;
  imageUrl: string | null;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  ingredients: string[];
  instructions: string[];
}

interface RecipeMetadata {
  source: string;
  category: string;
}

interface JsonViewerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipeData: RecipeData | null;
  metadata: RecipeMetadata;
}

export function JsonViewerModal({
  isOpen,
  onOpenChange,
  recipeData,
  metadata,
}: JsonViewerModalProps) {
  const { theme } = useTheme();
  // State to track fullscreen mode - resets to false whenever modal opens
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Reset fullscreen state when modal opens
  // This ensures modal always starts in non-fullscreen state
  useEffect(() => {
    if (isOpen) {
      setIsFullScreen(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={isFullScreen ? "max-w-full max-h-full w-screen h-screen p-6" : "max-w-3xl max-h-[90vh] p-6"}>
        {/* Fixed header section - stays at top with reduced spacing */}
        <DialogHeader>
          <DialogTitle>Recipe JSON Data</DialogTitle>
          <DialogDescription>
            This is the complete recipe data in JSON format that will be sent to the backend.
          </DialogDescription>
        </DialogHeader>
        
        {/* Fullscreen toggle button - minimal padding above code block */}
        <div className="flex justify-start pt-2 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="rounded-md"
          >
            {isFullScreen ? (
              <>
                <Shrink className="h-4 w-4" />
                Exit Full-screen
              </>
            ) : (
              <>
                <Expand className="h-4 w-4" />
                Go Full-screen
              </>
            )}
          </Button>
        </div>

        {/* Scrollable code block container */}
        {recipeData && (
          <div className="w-full overflow-x-auto">
            <SyntaxHighlighter 
              language="json" 
              style={theme === "dark" ? atelierCaveDark : atelierCaveLight}
              customStyle={{
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                margin: 0,
                width: '100%',
              }}
            >
              {JSON.stringify({ ...recipeData, ...metadata }, null, 2)}
            </SyntaxHighlighter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}