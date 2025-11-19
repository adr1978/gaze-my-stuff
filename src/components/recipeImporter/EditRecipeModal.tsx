/**
 * EditRecipeModal Component
 * 
 * Modal dialog for editing recipe data or creating new recipes manually.
 * Features:
 * - All recipe fields editable (title, image, times, servings, etc.)
 * - Ingredients textarea (one per line)
 * - Instructions textarea (auto-split into sentences on save)
 * - Recipe source and category fields (synced with metadata)
 * - Fixed footer with Cancel/Save buttons
 * - Scrollable content area with scroll indicator
 * 
 * Props:
 * - isOpen: Controls modal visibility
 * - onOpenChange: Callback when modal state changes
 * - editedRecipe: Current recipe data being edited
 * - setEditedRecipe: Function to update recipe data
 * - isNewRecipe: Whether this is a new recipe (vs editing existing)
 * - categories: List of available categories
 * - metadata: Recipe metadata (source, category)
 * - setMetadata: Function to update metadata
 * - onSave: Callback when save button is clicked
 */

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, ChevronDown } from "lucide-react";

interface RecipeData {
  title: string | null;
  url: string | null;
  imageUrl: string | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  ingredients: string[];
  instructions: string[];
  notes: string | null;
  description: string | null;
  source: string | null;
  category: string | null;
}

interface EditRecipeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editedRecipe: RecipeData | null;
  setEditedRecipe: (recipe: RecipeData | null) => void;
  isNewRecipe: boolean;
  categories: string[];
  onSave: () => void;
}

export function EditRecipeModal({
  isOpen,
  onOpenChange,
  editedRecipe,
  setEditedRecipe,
  isNewRecipe,
  categories,
  onSave,
}: EditRecipeModalProps) {
  // Ref for scroll area to detect scroll position
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Check if content is scrollable and user hasn't scrolled to bottom
  useEffect(() => {
    const checkScroll = () => {
      const element = scrollAreaRef.current;
      if (element) {
        const { scrollTop, scrollHeight, clientHeight } = element;
        // Show indicator if there's more content below
        setShowScrollIndicator(scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 20);
      }
    };

    checkScroll();
    const element = scrollAreaRef.current;
    element?.addEventListener('scroll', checkScroll);
    
    return () => element?.removeEventListener('scroll', checkScroll);
  }, [editedRecipe, isOpen]);

  // Scroll to bottom of content area
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        {/* Fixed header with reduced spacing */}
        <div className="p-6 pb-3">
          <DialogHeader>
            <DialogTitle>{isNewRecipe ? "New Recipe" : "Edit Recipe"}</DialogTitle>
            <DialogDescription>
              {isNewRecipe ? "Enter the recipe details manually" : "Make changes to the recipe data. Each line in Ingredients and Instructions will be treated as a separate item."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable content area with increased padding to prevent focus ring clipping */}
        <div className="relative flex-1 overflow-hidden">
          <ScrollArea className="h-[50vh] px-4" ref={scrollAreaRef}>
            {editedRecipe && (
              <div className="space-y-4 pb-6 mx-2">
                {/* Title field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    className="bg-background"
                    value={editedRecipe.title || ""}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
                  />
                </div>

                {/* Description field - displayed under title */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    className="bg-background"
                    rows={3}
                    placeholder="Brief description of the recipe"
                    value={editedRecipe.description || ""}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, description: e.target.value })}
                  />
                </div>

                {/* Recipe Source and Category - now part of recipe data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-source">Recipe Source</Label>
                    <Input
                      id="edit-source"
                      className="bg-background"
                      placeholder="e.g., Waitrose, BBC Good Food"
                      value={editedRecipe.source || ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, source: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={editedRecipe.category || ""}
                      onValueChange={(value) => setEditedRecipe({ ...editedRecipe, category: value })}
                    >
                      <SelectTrigger id="edit-category" className="bg-background">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Image URL field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-image-url">Image URL</Label>
                  <Input
                    id="edit-image-url"
                    className="bg-background"
                    placeholder="https://example.com/image.jpg"
                    value={editedRecipe.imageUrl || ""}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, imageUrl: e.target.value })}
                  />
                </div>

                {/* Servings, Prep Time, Cook Time in a row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-servings">Servings</Label>
                    <Input
                      id="edit-servings"
                      type="number"
                      className="bg-background"
                      value={editedRecipe.servings || ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, servings: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-preptime">Prep Time (minutes)</Label>
                    <Input
                      id="edit-preptime"
                      type="number"
                      className="bg-background"
                      value={editedRecipe.prep_time || ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, prep_time: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cooktime">Cook Time (minutes)</Label>
                    <Input
                      id="edit-cooktime"
                      type="number"
                      className="bg-background"
                      value={editedRecipe.cook_time || ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, cook_time: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Ingredients textarea */}
                <div className="space-y-2">
                  <Label htmlFor="edit-ingredients">Ingredients (one per line)</Label>
                  <Textarea
                    id="edit-ingredients"
                    className="bg-background"
                    rows={8}
                    value={editedRecipe.ingredients.join('\n')}
                    onChange={(e) => setEditedRecipe({ 
                      ...editedRecipe, 
                      ingredients: e.target.value.split('\n')
                    })}
                    placeholder="Enter each ingredient on a new line"
                  />
                </div>

                {/* Instructions textarea */}
                <div className="space-y-2">
                  <Label htmlFor="edit-instructions">Instructions (sentences will be split automatically)</Label>
                  <Textarea
                    id="edit-instructions"
                    className="bg-background"
                    rows={10}
                    value={editedRecipe.instructions.join('\n')}
                    onChange={(e) => setEditedRecipe({ 
                      ...editedRecipe, 
                      instructions: e.target.value.split('\n')
                    })}
                    placeholder="Enter instructions - sentences will be split automatically on save"
                  />
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Scroll indicator - shows when more content below */}
          {showScrollIndicator && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollToBottom}
                className="rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
              >
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </Button>
            </div>
          )}
        </div>

        {/* Fixed footer with action buttons */}
        <div className="border-t border-border p-6 pt-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-md">
              Cancel
            </Button>
            <Button onClick={onSave} className="rounded-md">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}