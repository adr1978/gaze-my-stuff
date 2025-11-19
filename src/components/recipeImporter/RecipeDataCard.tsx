/**
 * RecipeDataCard Component
 * 
 * Displays extracted recipe information in a structured card format.
 * Features:
 * - Recipe title, description, and thumbnail image
 * - Key properties (servings, prep time, cooking time, source, category)
 * - Ingredients list positioned to right of image
 * - Numbered instructions list
 * - Edit, View JSON, and Send to Whisk action buttons
 * 
 * Props:
 * - recipeData: Complete recipe information to display
 * - formatTime: Helper function to format time durations
 * - onOpenEditModal: Callback to open edit modal
 * - onOpenJsonModal: Callback to open JSON viewer
 * - onSendToBackend: Callback to send recipe data to backend
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Code, ImageIcon, ExternalLink, Send } from "lucide-react";

interface RecipeData {
  url: string;
  title: string; 
  servings: number | null; 
  prep_time: number | null; 
  cook_time: number | null; 
  ingredients: string[];
  instructions: string[];
  notes: string | null;
  imageUrl: string | null;
  description: string | null;
  source: string | null;
  category: string | null;
}

interface RecipeDataCardProps {
  recipeData: RecipeData;
  formatTime: (minutes: number | null) => string | null;
  onOpenEditModal: () => void;
  onOpenJsonModal: () => void;
  onSendToBackend: () => void;
}

export function RecipeDataCard({
  recipeData,
  formatTime,
  onOpenEditModal,
  onOpenJsonModal,
  onSendToBackend,
}: RecipeDataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipe Data</CardTitle>
        <CardDescription>Extracted information from the recipe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipe title */}
        <h3 className="text-xl font-semibold mb-2">{recipeData.title || "Untitled Recipe"}</h3>
        
        {/* Recipe description - displayed under title with no top padding */}
        {recipeData.description && (
          <p className="text-muted-foreground text-sm">{recipeData.description}</p>
        )}
        
        {/* 3-column layout: Image | Servings/Times | Source/Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Recipe thumbnail image */}
          <div className="flex-shrink-0">
            {recipeData.imageUrl ? (
              <img 
                src={recipeData.imageUrl} 
                alt={recipeData.title || "Recipe"} 
                className="w-full h-48 object-cover rounded-md border border-border"
                onError={(e) => {
                  // Fallback to placeholder SVG if image fails to load
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div className="w-full h-48 bg-muted rounded-md border border-border flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Column 2: Servings, Prep Time, Cooking Time - always render */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Servings:</span>
              <span className="text-muted-foreground">{recipeData.servings || "–"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Prep Time:</span>
              <span className="text-muted-foreground">
                {recipeData.prep_time 
                  ? formatTime(typeof recipeData.prep_time === 'string' ? parseInt(recipeData.prep_time) : recipeData.prep_time) 
                  : "–"
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Cooking Time:</span>
              <span className="text-muted-foreground">
                {recipeData.cook_time 
                  ? formatTime(typeof recipeData.cook_time === 'string' ? parseInt(recipeData.cook_time) : recipeData.cook_time)
                  : "–"
                }
              </span>
            </div>
          </div>

          {/* Column 3: Recipe Source and Category - now from recipeData */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Source:</span>
              {recipeData.source ? (
                recipeData.url ? (
                  <a 
                    href={recipeData.url} 
                    target="_blank" 
                    rel="noopener noreferrer nofollow"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {recipeData.source}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">{recipeData.source}</span>
                )
              ) : (
                <span className="text-muted-foreground">–</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Category:</span>
              <span className="text-muted-foreground">
                {recipeData.category || "–"}
              </span>
            </div>
          </div>
        </div>

        {/* Ingredients and Instructions side-by-side with 40%/60% split */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4">
          {/* Ingredients: 40% (2 of 5 columns) */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Ingredients</h4>
            {recipeData.ingredients.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {recipeData.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{ingredient}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No ingredients listed</p>
            )}
          </div>

          {/* Instructions: 60% (3 of 5 columns) */}
          <div className="md:col-span-3">
            <h4 className="font-semibold mb-2">Instructions</h4>
            {recipeData.instructions.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2">
                {recipeData.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{instruction}</li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground italic">No instructions provided</p>
            )}
          </div>
        </div>

        {/* Action buttons - Edit, View JSON, and Send to Whisk */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onOpenEditModal} variant="outline" className="rounded-md">
            <Edit className="h-4 w-4" />
            Edit Recipe
          </Button>
          <Button onClick={onOpenJsonModal} variant="outline" className="rounded-md">
            <Code className="h-4 w-4" />
            View JSON
          </Button>
          <Button onClick={onSendToBackend} variant="default" className="rounded-md">
            <Send className="h-4 w-4" />
            Send to Whisk
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}