/**
 * MetadataCard Component
 * 
 * Collects additional metadata (source and category) before backend submission.
 * These fields are the source of truth and sync with the Edit Recipe modal.
 * 
 * Props:
 * - metadata: Current metadata values (source, category)
 * - setMetadata: Function to update metadata
 * - categories: List of available categories
 * - onSendToBackend: Callback to trigger backend submission
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";

interface RecipeMetadata {
  source: string;
  category: string;
}

interface MetadataCardProps {
  metadata: RecipeMetadata;
  setMetadata: (metadata: RecipeMetadata) => void;
  categories: string[];
  onSendToBackend: () => void;
}

export function MetadataCard({
  metadata,
  setMetadata,
  categories,
  onSendToBackend,
}: MetadataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Metadata</CardTitle>
        <CardDescription>Add source and category before sending to Whisk</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Two-column layout for source and category inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recipe source input - free text field */}
          <div className="space-y-2">
            <Label htmlFor="source">Recipe Source</Label>
            <Input
              id="source"
              placeholder="e.g., Waitrose, BBC Good Food"
              value={metadata.source}
              onChange={(e) => setMetadata({ ...metadata, source: e.target.value })}
            />
          </div>

          {/* Category selector - dropdown with predefined categories */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={metadata.category}
              onValueChange={(value) => setMetadata({ ...metadata, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {/* Map through categories and format display names */}
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit button - triggers backend submission with complete payload */}
        <Button onClick={onSendToBackend} className="rounded-md">
          <Send className="h-4 w-4 mr-2" />
          Send to Whisk
        </Button>
      </CardContent>
    </Card>
  );
}