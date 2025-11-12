/**
 * RecipeSourceCard Component
 * 
 * Handles recipe URL input and extraction method selection.
 * Supports three extraction methods:
 * - AI Magic: Uses AI to extract recipe data from any URL
 * - Waitrose Parser: Specialized parser for Waitrose recipes
 * - Manual: Opens empty form for manual recipe entry
 * 
 * Props:
 * - url: Current URL value
 * - setUrl: Function to update URL
 * - extractionMethod: Currently selected extraction method
 * - setExtractionMethod: Function to change extraction method
 * - isAnalyzing: Loading state during extraction
 * - onAnalyze: Callback to trigger recipe extraction
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, Search, Wand2, Utensils, FilePlus } from "lucide-react";

type ExtractionMethod = "ai" | "waitrose" | "manual";

interface RecipeSourceCardProps {
  url: string;
  setUrl: (url: string) => void;
  extractionMethod: ExtractionMethod;
  setExtractionMethod: (method: ExtractionMethod) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export function RecipeSourceCard({
  url,
  setUrl,
  extractionMethod,
  setExtractionMethod,
  isAnalyzing,
  onAnalyze,
}: RecipeSourceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipe Source</CardTitle>
        <CardDescription>Enter a recipe URL to extract its data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Extraction method selection using ToggleGroup with animated indicator */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium">Choose method:</Label>
          <ToggleGroup 
            type="single" 
            value={extractionMethod} 
            onValueChange={(value) => value && setExtractionMethod(value as ExtractionMethod)}
          >
            <ToggleGroupItem value="ai">
              <Wand2 className="h-4 w-4 mr-1.5" />
              AI Magic
            </ToggleGroupItem>
            <ToggleGroupItem value="waitrose">
              <Utensils className="h-4 w-4 mr-1.5" />
              Waitrose Parser
            </ToggleGroupItem>
            <ToggleGroupItem value="manual">
              <FilePlus className="h-4 w-4 mr-1.5" />
              Manual
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* URL input field with search button */}
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/recipe"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              // Trigger extraction on Enter key press
              if (e.key === 'Enter' && !isAnalyzing) {
                onAnalyze();
              }
            }}
            disabled={extractionMethod === "manual"}
            className="flex-1"
          />
          <Button onClick={onAnalyze} disabled={isAnalyzing || extractionMethod === "manual"} className="rounded-md">
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}