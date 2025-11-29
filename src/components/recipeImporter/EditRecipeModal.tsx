import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, ChevronDown, Eraser, Check } from "lucide-react";

// --- Types ---

export interface RecipeItem {
  text: string;
  group: string | null;
}

interface RecipeData {
  title: string | null;
  url: string | null;
  imageUrl: string | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  ingredients: RecipeItem[];
  instructions: RecipeItem[];
  description: string | null;
  source: string | null;
  // UPDATED: Category array
  category: string[];
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

// --- Helper Functions ---

const toText = (items: RecipeItem[]): string => {
  let text = "";
  const mainItems = items.filter(i => !i.group);
  if (mainItems.length > 0) {
    text += mainItems.map(i => i.text).join('\n');
  }
  const groupedItems = items.filter(i => i.group);
  const groups: Record<string, RecipeItem[]> = {};
  groupedItems.forEach(i => {
    if (i.group) {
        if (!groups[i.group]) groups[i.group] = [];
        groups[i.group].push(i);
    }
  });
  Object.entries(groups).forEach(([groupName, groupList]) => {
      if (text) text += "\n\n";
      text += `${groupName}:\n` + groupList.map(i => i.text).join('\n');
  });
  return text;
};

const fromText = (text: string): RecipeItem[] => {
  const lines = text.split('\n');
  const items: RecipeItem[] = [];
  let currentGroup: string | null = null;
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.endsWith(':') && trimmed.length > 1) {
      currentGroup = trimmed.slice(0, -1);
    } else {
      items.push({ text: trimmed, group: currentGroup });
    }
  });
  return items;
};

// --- Main Component ---

export function EditRecipeModal({
  isOpen,
  onOpenChange,
  editedRecipe,
  setEditedRecipe,
  isNewRecipe,
  categories,
  onSave,
}: EditRecipeModalProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  const [ingText, setIngText] = useState("");
  const [instText, setInstText] = useState("");

  useEffect(() => {
    if (isOpen && editedRecipe) {
      setIngText(toText(editedRecipe.ingredients));
      setInstText(toText(editedRecipe.instructions));
    }
  }, [isOpen, editedRecipe?.url]);

  const handleIngChange = (val: string) => {
    setIngText(val);
    if (editedRecipe) {
      setEditedRecipe({ ...editedRecipe, ingredients: fromText(val) });
    }
  };

  const handleInstChange = (val: string) => {
    setInstText(val);
    if (editedRecipe) {
      setEditedRecipe({ ...editedRecipe, instructions: fromText(val) });
    }
  };

  // UPDATED: Handle multi-select checkboxes
  const handleCategoryToggle = (category: string, checked: boolean) => {
    if (!editedRecipe) return;
    const currentCategories = editedRecipe.category || [];
    let newCategories;
    if (checked) {
      newCategories = [...currentCategories, category];
    } else {
      newCategories = currentCategories.filter(c => c !== category);
    }
    setEditedRecipe({ ...editedRecipe, category: newCategories });
  };

  useEffect(() => {
    const checkScroll = () => {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 5;
        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };
    const timer = setTimeout(checkScroll, 100); 
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    viewport?.addEventListener('scroll', checkScroll);
    return () => {
      viewport?.removeEventListener('scroll', checkScroll);
      clearTimeout(timer);
    };
  }, [editedRecipe, isOpen]);

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    setIngText("");
    setInstText("");
    setEditedRecipe({
      title: "",
      url: "",
      imageUrl: "",
      servings: null,
      prep_time: null,
      cook_time: null,
      ingredients: [],
      instructions: [],
      description: "",
      source: "",
      category: [],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <div className="p-6 pb-3">
          <DialogHeader>
            <DialogTitle>{isNewRecipe ? "New Recipe" : "Edit Recipe"}</DialogTitle>
            <DialogDescription>
              {isNewRecipe ? "Enter the recipe details manually" : "Make changes to the recipe data."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <ScrollArea className="h-[50vh] px-4" ref={scrollAreaRef}>
            {editedRecipe && (
              <div className="space-y-4 pb-6 mx-2">
                
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    className="bg-background"
                    value={editedRecipe.title || ""}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
                  />
                </div>

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

                  {/* UPDATED: Multi-select Categories */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Categories</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="edit-category"
                          variant="outline"
                          className="w-full justify-start bg-background font-normal"
                        >
                          {(() => {
                            const selectedCategories = Array.isArray(editedRecipe.category) 
                              ? editedRecipe.category 
                              : editedRecipe.category 
                                ? [editedRecipe.category] 
                                : [];
                            return selectedCategories.length > 0 
                              ? selectedCategories.join(", ") 
                              : "Select categories";
                          })()}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-3" align="start">
                        <div className="space-y-2">
                          {categories.map((category) => {
                            const selectedCategories = Array.isArray(editedRecipe.category) 
                              ? editedRecipe.category 
                              : editedRecipe.category 
                                ? [editedRecipe.category] 
                                : [];
                            const isChecked = selectedCategories.includes(category);
                            
                            return (
                              <div key={category} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${category}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    let newCategories: string[];
                                    if (checked) {
                                      newCategories = [...selectedCategories, category];
                                    } else {
                                      newCategories = selectedCategories.filter(c => c !== category);
                                    }
                                    setEditedRecipe({ 
                                      ...editedRecipe, 
                                      category: newCategories.length > 0 ? newCategories : null 
                                    });
                                  }}
                                />
                                <label
                                  htmlFor={`category-${category}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {category}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

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

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="edit-ingredients">Ingredients</Label>
                    <span className="text-xs text-muted-foreground">End line with colon for header (e.g. "For the Icing:")</span>
                  </div>
                  <Textarea
                    id="edit-ingredients"
                    className="bg-background text-sm"
                    rows={8}
                    value={ingText}
                    onChange={(e) => handleIngChange(e.target.value)}
                    placeholder={`2 Eggs\n\nFor the Sauce:\n1 cup Milk`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="edit-instructions">Instructions</Label>
                    <span className="text-xs text-muted-foreground">End line with colon for header (e.g. "Cook's Tip:")</span>
                  </div>
                  <Textarea
                    id="edit-instructions"
                    className="bg-background text-sm"
                    rows={10}
                    value={instText}
                    onChange={(e) => handleInstChange(e.target.value)}
                    placeholder={`Mix ingredients.\n\nCook's Tip:\nDon't overmix.`}
                  />
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="border-t border-border p-6 pt-4 relative flex justify-between items-center">
          {showScrollIndicator && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollToBottom}
                className="rounded-full h-8 w-8 bg-background shadow-md border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 animate-in fade-in zoom-in-95"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={handleClearAll} 
            className="text-muted-foreground hover:text-foreground"
            title="Clear all fields"
          >
            <Eraser className="h-4 w-4 mr-2" />
            Clear All
          </Button>

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