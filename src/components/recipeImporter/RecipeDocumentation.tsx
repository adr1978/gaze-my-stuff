/**
 * RecipeDocumentation Component
 * 
 * Displays comprehensive documentation about the Recipe Importer page.
 * Explains design, functionality, and technical integration details.
 * 
 * This component renders as a modal dialog triggered by a button at the bottom of the page.
 */

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function RecipeDocumentation() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-md">
          <Info className="h-4 w-4 mr-2" />
          Design & Feature Documentation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Recipe Importer - Design & Feature Documentation</DialogTitle>
          <DialogDescription>
            Comprehensive documentation for the Recipe Importer system
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Overview Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Overview</h3>
              <p className="text-muted-foreground mb-2">
                The Recipe Importer is a tool for extracting structured recipe data from URLs using either AI-powered extraction or specialized parsers. It provides a clean interface for viewing, editing, and exporting recipe information.
              </p>
            </section>

            {/* Design System Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Design System</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Color Palette:</strong> Uses semantic HSL color tokens (--primary, --muted, --border, --foreground, --background)</li>
                <li><strong>Input Fields:</strong> All inputs have consistent bg-muted/30 background with border for visual cohesion</li>
                <li><strong>Buttons:</strong> Rounded-md styling throughout with appropriate variants (outline, primary)</li>
                <li><strong>Cards:</strong> Shadcn Card components with subtle shadows and consistent padding</li>
                <li><strong>Modals:</strong> Consistent DialogHeader styling across all modals (title + description)</li>
                <li><strong>Typography:</strong> Responsive sizing with semantic heading hierarchy</li>
              </ul>
            </section>

            {/* Extraction Methods Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Extraction Methods</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>AI Magic (Default):</strong> Uses AI to intelligently extract recipe data from any URL. Calls Supabase edge function 'analyze-recipe' with Lovable AI integration</li>
                <li><strong>Waitrose Parser:</strong> Specialized parser optimized for Waitrose recipe pages. More reliable for this specific source</li>
                <li><strong>Manual:</strong> Opens empty recipe form for manual data entry. Useful when no URL is available</li>
                <li><strong>Selection UI:</strong> Toggle-style buttons with active state highlighting using primary colors</li>
                <li><strong>Keyboard Support:</strong> Press Enter in URL field to trigger extraction</li>
              </ul>
            </section>

            {/* Recipe Data Card Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Recipe Data Display</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Recipe Title:</strong> Displayed prominently at top of card (text-xl font-semibold)</li>
                <li><strong>Thumbnail Image:</strong> 128x128px image with rounded corners, shows placeholder if unavailable</li>
                <li><strong>Recipe Properties:</strong> Servings, Prep Time, and Cooking Time stacked vertically beside image</li>
                <li><strong>Source Link:</strong> Clickable link to original recipe URL with source name as label</li>
                <li><strong>Category:</strong> Display of recipe category from predefined list</li>
                <li><strong>Ingredients List:</strong> Positioned to right of image, bullet-point list with proper spacing</li>
                <li><strong>Instructions:</strong> Numbered list below ingredients, each instruction on separate line</li>
                <li><strong>Action Buttons:</strong> Edit Recipe and View JSON buttons below content</li>
              </ul>
            </section>

            {/* Edit Recipe Modal Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Edit Recipe Modal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Purpose:</strong> Edit extracted recipe data or create new recipes manually</li>
                <li><strong>Fixed Footer:</strong> Cancel and Save buttons fixed at bottom with border separator</li>
                <li><strong>Scrollable Content:</strong> Input fields scroll independently of buttons</li>
                <li><strong>Scroll Indicator:</strong> Down arrow appears when content exceeds visible area</li>
                <li><strong>Field Layout:</strong> Title, Image URL, then Recipe Source and Category side-by-side</li>
                <li><strong>Time/Servings Grid:</strong> Three-column layout for Servings, Prep Time, Cook Time</li>
                <li><strong>Textarea Fields:</strong> Ingredients (one per line) and Instructions (auto-split into sentences)</li>
                <li><strong>Instruction Processing:</strong> Automatically splits text into separate sentences on save</li>
                <li><strong>Metadata Sync:</strong> Source and Category fields sync with Additional Metadata card</li>
                <li><strong>All Input Fields:</strong> White background (bg-background) for visibility against modal</li>
              </ul>
            </section>

            {/* JSON Viewer Modal Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">JSON Viewer Modal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Purpose:</strong> Display recipe data in structured JSON format for debugging/export</li>
                <li><strong>Syntax Highlighting:</strong> Uses react-syntax-highlighter with atelierCaveLight theme</li>
                <li><strong>Fullscreen Toggle:</strong> Button to expand modal to full screen for better viewing</li>
                <li><strong>Button States:</strong> Shows "Go Full-screen" or "Exit full-screen" with appropriate icons</li>
                <li><strong>Scrolling Behavior:</strong> Only code block scrolls horizontally, header/buttons remain fixed</li>
                <li><strong>JSON Content:</strong> Combines recipe data and metadata into single prettified JSON object</li>
              </ul>
            </section>

            {/* Additional Metadata Card Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Additional Metadata</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Purpose:</strong> Collect source and category information before sending to backend</li>
                <li><strong>Source Field:</strong> Free-text input for recipe source (e.g., "Waitrose", "BBC Good Food")</li>
                <li><strong>Category Dropdown:</strong> Select from predefined categories (bread, christmas, drinks, etc.)</li>
                <li><strong>Two-Column Layout:</strong> Fields arranged side-by-side on desktop</li>
                <li><strong>Send Button:</strong> Triggers backend submission with complete recipe + metadata payload</li>
                <li><strong>Validation:</strong> Ensures both fields are filled before allowing submission</li>
              </ul>
            </section>

            {/* Technical Integration Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Technical Integration</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Component Architecture:</strong> Main page (RecipeAnalyser.tsx) orchestrates child components</li>
                <li><strong>Child Components:</strong>
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>- RecipeSourceCard: URL input and method selection</li>
                    <li>- RecipeDataCard: Display extracted recipe information</li>
                    <li>- MetadataCard: Collect additional metadata</li>
                    <li>- EditRecipeModal: Edit/create recipe forms</li>
                    <li>- JsonViewerModal: JSON data viewer</li>
                    <li>- RecipeDocumentation: This documentation modal</li>
                  </ul>
                </li>
                <li><strong>AI Integration:</strong> Calls Supabase edge function 'analyze-recipe' which uses Lovable AI (Gemini models)</li>
                <li><strong>Edge Function:</strong> Located at supabase/functions/analyze-recipe/index.ts</li>
                <li><strong>HTML Decoding:</strong> Uses decodeHtmlEntities helper to clean special characters (°, etc.)</li>
                <li><strong>State Management:</strong> React useState hooks manage recipe data, modals, and form state</li>
                <li><strong>Data Flow:</strong> URL → Edge Function → Recipe Data → Display Cards → Edit → Backend</li>
                <li><strong>Toast Notifications:</strong> User feedback for success/error states using Shadcn Toast</li>
              </ul>
            </section>

            {/* Data Structure Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Data Structure</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>RecipeData Interface:</strong> name, url, imageUrl, servings, prepTime, cookTime, ingredients[], instructions[]</li>
                <li><strong>RecipeMetadata Interface:</strong> source, category</li>
                <li><strong>Time Format:</strong> Stored as integers (minutes), displayed as "X hrs Y mins"</li>
                <li><strong>Ingredients Array:</strong> Each ingredient as separate string in array</li>
                <li><strong>Instructions Array:</strong> Automatically split into sentences, each as array element</li>
                <li><strong>Categories:</strong> Predefined list (bread, christmas, drinks, easter, fish, halloween, high_protein, ice_cream, light_bites, lunches, poultry, red_meat, puddings, sandwiches, side_dishes, system, vegetarian)</li>
              </ul>
            </section>

            {/* Key Features Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Key Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Flexible Extraction:</strong> Multiple methods (AI, parser, manual) for different use cases</li>
                <li><strong>Visual Data Review:</strong> Clean card-based display of extracted information</li>
                <li><strong>Easy Editing:</strong> Modal-based editing with intuitive form controls</li>
                <li><strong>JSON Export:</strong> View formatted JSON for debugging or API integration</li>
                <li><strong>Metadata Enrichment:</strong> Add source and category before backend submission</li>
                <li><strong>Smart Processing:</strong> Automatic sentence splitting for instructions</li>
                <li><strong>Error Handling:</strong> Graceful fallbacks and user-friendly error messages</li>
                <li><strong>Responsive Design:</strong> Works across desktop and mobile devices</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
