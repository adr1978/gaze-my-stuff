/**
 * RecipeDataCard Component
 * * UPDATES:
 * - Instruction numbers now have a fixed width and center alignment.
 * - This prevents the instruction text from shifting position when numbering jumps from single (9) to double digits (10).
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Edit, Braces, Send, ExternalLink, ImageIcon, Tag, Link2, Carrot, ListOrdered } from "lucide-react";

export interface RecipeItem {
  text: string;
  group: string | null;
}

export interface RecipeData {
  url: string;
  title: string; 
  servings: number | null; 
  prep_time: number | null; 
  cook_time: number | null; 
  ingredients: RecipeItem[];
  instructions: RecipeItem[];
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

const GroupedList = ({ items, type }: { items: RecipeItem[], type: 'ingredients' | 'instructions' }) => {
  const groups: Record<string, RecipeItem[]> = {};
  const mainItems: RecipeItem[] = [];

  items.forEach(item => {
    if (item.group) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    } else {
      mainItems.push(item);
    }
  });

  return (
    <div className="space-y-4">
      {mainItems.length > 0 && (
        <ul className="space-y-1">
          {mainItems.map((item, i) => (
            <ListItem key={i} item={item} index={i} type={type} />
          ))}
        </ul>
      )}

      {Object.entries(groups).map(([groupName, groupItems]) => (
        <div key={groupName}>
          <h5 className="font-medium text-sm text-primary/80 mb-2 mt-3">
            {groupName}
          </h5>
          <ul className="space-y-1">
            {groupItems.map((item, i) => (
               <ListItem key={i} item={item} index={i} type={type} />
            ))}
          </ul>
        </div>
      ))}
      
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground italic opacity-70">
          No {type} provided
        </p>
      )}
    </div>
  );
};

const ListItem = ({ item, index, type }: { item: RecipeItem, index: number, type: 'ingredients' | 'instructions' }) => {
  if (type === 'ingredients') {
    return (
      <li className="flex gap-2 items-start">
        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 flex-shrink-0 ml-3" />
        <span className="text-sm text-muted-foreground">{item.text}</span>
      </li>
    );
  }

  return (
    <li className="flex gap-3 items-start group">
      {/* Fixed width (w-6) + justify-center ensures text alignment stability 
        regardless of digit count (e.g. 1 vs 10).
      */}
      <span className="inline-flex items-center justify-center w-6 text-xs font-bold text-muted-foreground/60 mt-0.5 bg-muted-foreground/5 py-0.5 rounded border border-primary/10 flex-shrink-0 ml-3">
        {index + 1}
      </span>
      <p className="text-sm text-muted-foreground">{item.text}</p>
    </li>
  );
};

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
        <div>
          <h3 className="text-xl font-semibold">{recipeData.title || "Untitled Recipe"}</h3>
          {recipeData.description && (
            <p className="text-muted-foreground text-sm">{recipeData.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex-shrink-0">
            {recipeData.imageUrl ? (
              <img 
                src={recipeData.imageUrl} 
                alt={recipeData.title || "Recipe"} 
                className="w-full h-48 object-cover rounded-md border border-border"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div className="w-full h-48 bg-muted rounded-md border border-border flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Servings:</span>
              <span className="text-muted-foreground">{recipeData.servings || "–"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Prep Time:</span>
              <span className="text-muted-foreground">
                {recipeData.prep_time 
                  ? formatTime(typeof recipeData.prep_time === 'string' ? parseInt(recipeData.prep_time) : recipeData.prep_time) 
                  : "–"
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Cooking Time:</span>
              <span className="text-muted-foreground">
                {recipeData.cook_time 
                  ? formatTime(typeof recipeData.cook_time === 'string' ? parseInt(recipeData.cook_time) : recipeData.cook_time)
                  : "–"
                }
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />              
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
              <Tag className="h-4 w-4 text-primary" />              
              <span className="font-medium text-foreground">Category:</span>
              <span className="text-muted-foreground">
                {recipeData.category || "–"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 py-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Carrot className="h-4 w-4 text-foreground" />
              <h4 className="font-semibold">Ingredients</h4>
            </div>
            <GroupedList items={recipeData.ingredients} type="ingredients" />
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered className="h-4 w-4 text-foreground" />
              <h4 className="font-semibold">Instructions</h4>
            </div>
            <GroupedList items={recipeData.instructions} type="instructions" />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="flex gap-2">
            <Button onClick={onOpenEditModal} variant="outline" className="rounded-md">
              <Edit className="h-4 w-4" />
              Edit Recipe
            </Button>
            <Button onClick={onOpenJsonModal} variant="outline" className="rounded-md">
              <Braces className="h-4 w-4" />
              View JSON
            </Button>
          </div>
          <Button onClick={onSendToBackend} variant="default" className="rounded-md">
            <Send className="h-4 w-4" />
            Send to Whisk
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}