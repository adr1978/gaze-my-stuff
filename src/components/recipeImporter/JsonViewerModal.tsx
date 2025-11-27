/**
 * JsonViewerModal Component
 * * Displays recipe data as formatted, syntax-highlighted JSON.
 * * UPDATES:
 * - Updated RecipeData interface to match the new grouped structure (RecipeItem[]).
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

// Types
export interface RecipeItem {
  text: string;
  group: string | null;
}

interface RecipeData {
  url: string | null;
  title: string | null; 
  description: string | null;
  servings: number | null; 
  prep_time: number | null; 
  cook_time: number | null; 
  ingredients: RecipeItem[]; // Changed from string[]
  instructions: RecipeItem[]; // Changed from string[]
  notes: string | null;
  imageUrl: string | null;
  source: string | null;
  category: string | null;
}

interface JsonViewerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipeData: RecipeData | null;
}

export function JsonViewerModal({
  isOpen,
  onOpenChange,
  recipeData,
}: JsonViewerModalProps) {
  const { resolvedTheme } = useTheme();
  // State to track fullscreen mode - resets to false whenever modal opens
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Reset fullscreen state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsFullScreen(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={isFullScreen ? "max-w-full max-h-full w-screen h-screen p-6 flex flex-col" : "max-w-3xl max-h-[90vh] p-6 flex flex-col"}>
        {/* Fixed header section */}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Recipe JSON Data</DialogTitle>
          <DialogDescription>
            This is the complete recipe data in JSON format that will be sent to the backend.
          </DialogDescription>
        </DialogHeader>
        
        {/* Fullscreen toggle button - fixed spacing */}
        <div className="flex justify-start py-3 flex-shrink-0">
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

        {/* Scrollable code block container - grows to fill available space */}
        {recipeData && (
          <div className="flex-1 overflow-auto min-h-0">
            <SyntaxHighlighter 
              language="json" 
              style={resolvedTheme === "dark" ? atelierCaveDark : atelierCaveLight}
              customStyle={{
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                margin: 0,
                width: '100%',
                padding: '1rem',
                paddingRight: '1rem',
              }}
            >
              {JSON.stringify(recipeData, null, 2)}
            </SyntaxHighlighter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}