import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, ChevronDown, Eraser } from "lucide-react";

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
  // Ref for scroll area
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Check scroll position
  useEffect(() => {
    const checkScroll = () => {
      // Target the viewport element provided by Shadcn/Radix ScrollArea
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        // Show if content is scrollable AND we are not at the bottom (within 5px buffer)
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 5;
        
        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };

    // Initial check with slight delay for layout render
    const timer = setTimeout(checkScroll, 100); 

    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    viewport?.addEventListener('scroll', checkScroll);
    
    return () => {
      viewport?.removeEventListener('scroll', checkScroll);
      clearTimeout(timer);
    };
  }, [editedRecipe, isOpen]);

  // Scroll to bottom handler
  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Clear all fields handler (Instant action, no confirm)
  const handleClearAll = () => {
    setEditedRecipe({
      title: "",
      url: "",
      imageUrl: "",
      servings: null,
      prep_time: null,
      cook_time: null,
      ingredients: [],
      instructions: [],
      notes: "",
      description: "",
      source: "",
      category: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        {/* Header */}
        <div className="p-6 pb-3">
          <DialogHeader>
            <DialogTitle>{isNewRecipe ? "New Recipe" : "Edit Recipe"}</DialogTitle>
            <DialogDescription>
              {isNewRecipe ? "Enter the recipe details manually" : "Make changes to the recipe data."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="relative flex-1 overflow-hidden">
          <ScrollArea className="h-[50vh] px-4" ref={scrollAreaRef}>
            {editedRecipe && (
              <div className="space-y-4 pb-6 mx-2">
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    className="bg-background"
                    value={editedRecipe.title || ""}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    className="bg-background"
                    rows={3}
                    value={editedRecipe.description || ""}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, description: e.target.value })}
                  />
                </div>

                {/* Source & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-source">Recipe Source</Label>
                    <Input
                      id="edit-source"
                      className="bg-background"
                      placeholder="e.g., Waitrose"
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
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Recipe URL & Image URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-url">Recipe URL</Label>
                    <Input
                      id="edit-url"
                      className="bg-background"
                      placeholder="https://example.com/recipe"
                      value={editedRecipe.url || ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, url: e.target.value })}
                    />
                  </div>
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
                </div>

                {/* Times & Servings */}
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
                    <Label htmlFor="edit-preptime">Prep Time (mins)</Label>
                    <Input
                      id="edit-preptime"
                      type="number"
                      className="bg-background"
                      value={editedRecipe.prep_time || ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, prep_time: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cooktime">Cook Time (mins)</Label>
                    <Input
                      id="edit-cooktime"
                      type="number"
                      className="bg-background"
                      value={editedRecipe.cook_time || ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, cook_time: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Ingredients */}
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
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="edit-instructions">Instructions</Label>
                  <Textarea
                    id="edit-instructions"
                    className="bg-background"
                    rows={10}
                    value={editedRecipe.instructions.join('\n')}
                    onChange={(e) => setEditedRecipe({ 
                      ...editedRecipe, 
                      instructions: e.target.value.split('\n')
                    })}
                  />
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer with Actions */}
        {/* relative: Needed for positioning the floating arrow */}
        <div className="border-t border-border p-6 pt-4 relative flex justify-between items-center">
          
          {/* Floating Scroll Indicator - Centered on top border */}
          {showScrollIndicator && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollToBottom}
                // bg-background: Ensures the button covers the border line behind it
                className="rounded-full h-8 w-8 bg-background shadow-md border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 animate-in fade-in zoom-in-95"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Left: Clear All - Styled like Cancel */}
          <Button 
            variant="outline" 
            onClick={handleClearAll} 
            className="text-muted-foreground hover:text-foreground"
            title="Clear all fields"
          >
            <Eraser className="h-4 w-4 mr-2" />
            Clear All
          </Button>

          {/* Right: Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}