import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2">Documentation</h1>
        <p className="text-muted-foreground mb-6">
          Complete design guide and feature documentation for all pages
        </p>

        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted/70 p-1">
            <TabsTrigger value="design">Design Guide</TabsTrigger>
            <TabsTrigger value="notion">Notion Studio</TabsTrigger>
            <TabsTrigger value="recipe">Recipe Importer</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="bank">Bank Connections</TabsTrigger>
          </TabsList>

          {/* Global Design Style Guide */}
          <TabsContent value="design" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Global Design Style Guide</h2>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-6 pr-4">
                  {/* Design System */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">Design System & Color Palette</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <p className="font-semibold text-foreground mb-2">Colors (HSL format):</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li><strong>Background:</strong> 220 15% 97% (light mode) / 222.2 84% 4.9% (dark mode)</li>
                          <li><strong>Foreground:</strong> 224 15% 20% (light mode) / 210 40% 98% (dark mode)</li>
                          <li><strong>Primary:</strong> 217 91% 60% (bright blue) - used for primary actions, active states</li>
                          <li><strong>Card:</strong> 0 0% 100% (white) with subtle shadows</li>
                          <li><strong>Muted:</strong> 220 14% 96% for subtle backgrounds and disabled states</li>
                          <li><strong>Border:</strong> 220 13% 91% for consistent borders</li>
                          <li><strong>Accent:</strong> Used for hover states and secondary highlights</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Typography:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li><strong>Page titles:</strong> text-4xl font-bold - Main page headings</li>
                          <li><strong>Page descriptions:</strong> text-muted-foreground - Subtitle under page titles</li>
                          <li><strong>Section headings:</strong> text-2xl font-semibold or text-xl font-semibold</li>
                          <li><strong>Card titles:</strong> text-xl font-semibold</li>
                          <li><strong>Labels:</strong> text-sm font-medium</li>
                          <li><strong>Body text:</strong> text-base with text-muted-foreground for secondary content</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Layout Principles */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">Layout Principles</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Container:</strong> max-w-7xl mx-auto for consistent page width across all pages</li>
                      <li><strong>Spacing:</strong> p-8 for page padding, consistent vertical rhythm with mb-2 for titles, mb-6 for descriptions</li>
                      <li><strong>Cards:</strong> Use Shadcn Card components with p-6 padding and subtle shadows</li>
                      <li><strong>Grid Layouts:</strong> gap-6 spacing between cards and components</li>
                      <li><strong>Responsive:</strong> Mobile-first approach with breakpoints at md: and lg:</li>
                      <li><strong>Navigation:</strong> Collapsible sidebar on left with home link, grouped navigation, and theme toggle</li>
                    </ul>
                  </section>

                  <Separator />

                  {/* Component Patterns */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">Component Patterns</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">Buttons:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Primary actions: rounded-full with solid background</li>
                          <li>Secondary actions: rounded-md with outline variant</li>
                          <li>Icons from lucide-react, typically h-4 w-4 with mr-2 spacing</li>
                          <li>Loading state: Loader2 icon with animate-spin</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Toggle Groups:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Animated sliding background indicator</li>
                          <li>Hover state only on inactive items (accent/60 background)</li>
                          <li>Active state with primary background and primary-foreground text</li>
                          <li>Available in sm, default, and lg sizes</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Forms:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Labels: text-sm font-medium mb-2</li>
                          <li>Inputs: bg-background with border, rounded-md</li>
                          <li>Textareas: min-height with bg-card for contrast</li>
                          <li>Validation: Inline error messages with destructive color</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Interaction Patterns */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">Interaction Patterns</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Hover States:</strong> hover:bg-muted/50 for clickable items, hover:shadow-md for cards</li>
                      <li><strong>Active States:</strong> ring-2 ring-primary for selected items</li>
                      <li><strong>Transitions:</strong> transition-all for smooth state changes</li>
                      <li><strong>Loading States:</strong> Skeleton components or Loader2 icons with animations</li>
                      <li><strong>Toast Notifications:</strong> Success (green icon), Error (red icon), Info (blue icon)</li>
                      <li><strong>Modals:</strong> Fixed footer with action buttons, scrollable content</li>
                    </ul>
                  </section>

                  <Separator />

                  {/* Accessibility */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">Accessibility</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Semantic HTML:</strong> Proper heading hierarchy, button vs. link usage</li>
                      <li><strong>ARIA Labels:</strong> aria-label on icon-only buttons</li>
                      <li><strong>Keyboard Navigation:</strong> Focus states visible, tab order logical</li>
                      <li><strong>Color Contrast:</strong> WCAG AA compliant contrast ratios</li>
                      <li><strong>Screen Reader Support:</strong> Descriptive text for icons and actions</li>
                    </ul>
                  </section>
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Notion Cover Studio Documentation */}
          <TabsContent value="notion" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Notion Cover Studio</h2>
              <p className="text-muted-foreground mb-6">
                Multi-layer canvas editor for creating beautiful Notion cover images with patterns and effects
              </p>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-6 pr-4 text-sm">
                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Core Features</h3>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong>Multi-Layer Canvas:</strong> Upload up to 5 images as separate layers that can be manipulated independently</li>
                      <li><strong>Layer Manager:</strong> Visual thumbnail-based manager for reordering, selecting, and removing layers</li>
                      <li><strong>Transform Controls:</strong> Scale, rotation, opacity, and position controls for each layer</li>
                      <li><strong>Pattern System:</strong> Apply grid, brick, diamonds, mirror, random, or spread patterns to any layer</li>
                      <li><strong>Canvas Sizes:</strong> Preset sizes for Notion covers (1500x600), 16:9, 4:3, 3:2, and 1:1 aspect ratios</li>
                      <li><strong>Export Options:</strong> PNG or JPG format with 1x, 2x, or 3x quality multipliers</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Canvas & Layer System</h3>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong>HTML5 Canvas:</strong> All rendering done on a single canvas element with responsive sizing</li>
                      <li><strong>Letterbox Effect:</strong> Canvas maintains aspect ratio within fixed-width card container</li>
                      <li><strong>Layer State:</strong> Each layer stores image, scale, rotation, opacity, position, pattern, and initial state</li>
                      <li><strong>Auto-Fit:</strong> New images automatically scale to fit within canvas dimensions</li>
                      <li><strong>Thumbnail Generation:</strong> 128x128px thumbnails created on upload for layer manager</li>
                      <li><strong>Drag & Drop:</strong> Active layer can be dragged to reposition on canvas</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Controls</h3>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong>Canvas Controls:</strong> Size selection, background color picker, quality/format settings, upload, and export</li>
                      <li><strong>Image Controls:</strong> Scale slider (0.1-3.0), rotation slider (-180° to 180°), opacity slider (0-100%), reset button</li>
                      <li><strong>Pattern Controls:</strong> 2x3 grid of pattern buttons, spacing slider (disabled for random/spread patterns)</li>
                      <li><strong>Layer Manager:</strong> Fixed position (top-right), shows thumbnails with active state indicator, drag-to-reorder</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Technical Implementation</h3>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong>State Management:</strong> All state in Index.tsx using React useState and useMemo hooks</li>
                      <li><strong>Component Structure:</strong> CanvasEditor, CanvasControls, ImageControls, PatternControls, LayerManager</li>
                      <li><strong>Pattern Generation:</strong> Random patterns generate coordinates with rotation/scale jitter</li>
                      <li><strong>Export Process:</strong> Creates temporary canvas, scales by quality multiplier, renders all layers, triggers download</li>
                      <li><strong>Transform Mode:</strong> Toggle between drag mode and transform (scale/rotate) mode</li>
                    </ul>
                  </section>
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Recipe Importer Documentation */}
          <TabsContent value="recipe" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Recipe Importer</h2>
              <p className="text-muted-foreground mb-6">
                Extract, edit, and manage recipe data from URLs using AI or specialized parsers
              </p>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-6 pr-4">
                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Extraction Methods</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>AI Magic:</strong> Uses Lovable AI (Gemini models) to intelligently extract recipe data from any URL</li>
                      <li><strong>Waitrose Parser:</strong> Specialized parser optimized for Waitrose recipe pages</li>
                      <li><strong>Manual Entry:</strong> Opens empty form for manual recipe creation when no URL available</li>
                      <li><strong>Toggle Selection:</strong> Small toggle group for method selection with hover states</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Data Display & Editing</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Recipe Data Card:</strong> Shows extracted title, image, servings, times, ingredients, instructions</li>
                      <li><strong>Edit Modal:</strong> Full-featured form with scrollable content and fixed footer buttons</li>
                      <li><strong>Scroll Indicator:</strong> Down arrow appears when content exceeds visible area</li>
                      <li><strong>Auto-Processing:</strong> Instructions automatically split into sentences on save</li>
                      <li><strong>JSON Viewer:</strong> Syntax-highlighted JSON display with fullscreen toggle</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Metadata & Categories</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Source Field:</strong> Free-text input for recipe source (e.g., "Waitrose", "BBC Good Food")</li>
                      <li><strong>Category Dropdown:</strong> Predefined categories including bread, christmas, drinks, fish, vegetarian, etc.</li>
                      <li><strong>Validation:</strong> Both fields required before backend submission</li>
                      <li><strong>Sync with Edit:</strong> Metadata fields sync between Edit Modal and Metadata Card</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Technical Details</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Edge Function:</strong> analyze-recipe function at supabase/functions/analyze-recipe/index.ts</li>
                      <li><strong>HTML Decoding:</strong> Helper function cleans special characters (°C, etc.)</li>
                      <li><strong>Data Structure:</strong> RecipeData and RecipeMetadata interfaces with typed fields</li>
                      <li><strong>Time Format:</strong> Stored as minutes, displayed as "X hrs Y mins"</li>
                      <li><strong>Component Architecture:</strong> RecipeSourceCard, RecipeDataCard, MetadataCard, EditRecipeModal, JsonViewerModal</li>
                    </ul>
                  </section>
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Investments Documentation */}
          <TabsContent value="investments" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Investments</h2>
              <p className="text-muted-foreground mb-6">
                Track mutual fund and stock holdings with interactive charts and purchase history
              </p>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-6 pr-4">
                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Account Management</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Multi-Account Support:</strong> Manage multiple investment accounts (ISAs, JISAs, etc.)</li>
                      <li><strong>Account Selector:</strong> Dropdown shows account name and owner</li>
                      <li><strong>Key Metrics:</strong> Total shares, current price, and total value displayed prominently</li>
                      <li><strong>Currency Format:</strong> GBP (£) with comma separators and 2 decimal places</li>
                      <li><strong>Data Persistence:</strong> All data stored in localStorage under 'investmentAccounts' key</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Interactive Charting</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Chart Library:</strong> Recharts LineChart with responsive container</li>
                      <li><strong>Interval Toggle:</strong> Week (Fridays), Month (month-end), Year (year-end) aggregation</li>
                      <li><strong>Purchase Markers:</strong> Small dots on chart line where purchases occurred</li>
                      <li><strong>Custom Tooltip:</strong> Shows date, total value, shares held, price, and purchase details</li>
                      <li><strong>Styling:</strong> Primary color line, white active dot with primary outline</li>
                      <li><strong>Data Aggregation:</strong> Daily historical data aggregated on-the-fly by selected interval</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Purchase Tracking</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Purchase History:</strong> Chronological list of all share purchases</li>
                      <li><strong>Date Format:</strong> Long format (e.g., "15 January 2024")</li>
                      <li><strong>Hover Interaction:</strong> Background highlight and edit icon appears on hover</li>
                      <li><strong>Click to Edit:</strong> Opens modal with pre-populated data</li>
                      <li><strong>Add Purchase:</strong> Dialog with shares input and date picker</li>
                      <li><strong>Validation:</strong> Ensures shares {'>'}  0 before saving</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Technical Architecture</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Main Component:</strong> src/pages/Investments.tsx orchestrates all functionality</li>
                      <li><strong>Child Components:</strong> AccountSelectionCard, ChartingCard, PurchaseHistoryCard, AddPurchaseDialog</li>
                      <li><strong>State Management:</strong> React useState hooks for accounts, selected account, modal state, form data</li>
                      <li><strong>Data Structure:</strong> FundAccount with id, accountName, owner, fundName, totalShares, purchases[], historicalData[]</li>
                      <li><strong>Helper Functions:</strong> aggregateDataByInterval, generateHistoricalData, formatCurrency</li>
                    </ul>
                  </section>
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Bank Connections Documentation */}
          <TabsContent value="bank" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Bank Connections</h2>
              <p className="text-muted-foreground mb-6">
                Connect and manage bank accounts via open banking integrations
              </p>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-6 pr-4">
                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Overview</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      The Bank Connections page allows users to securely connect their bank accounts through open banking providers.
                      It manages bank requisitions, displays account details, and controls transaction synchronization.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Key Features</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Bank Selection:</strong> Modal interface for choosing banks from available institutions</li>
                      <li><strong>Requisition Cards:</strong> Display connected banks with status indicators and account lists</li>
                      <li><strong>Account Details:</strong> View balances, account numbers, and transaction sync status</li>
                      <li><strong>Sync Control:</strong> Toggle transaction synchronization per account with API integration</li>
                      <li><strong>Reconfirmation:</strong> Refresh expired connections through secure reconfirmation flow</li>
                      <li><strong>Loading States:</strong> Skeleton components during data fetching</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Technical Integration</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>API Client:</strong> Uses @tanstack/react-query for data fetching and mutations</li>
                      <li><strong>Query Keys:</strong> ["requisitions"] for requisition data caching</li>
                      <li><strong>Mutations:</strong> toggleSync and reconfirm mutations with automatic query invalidation</li>
                      <li><strong>Components:</strong> RequisitionCard, BankSelectionModal, AccountDetailsModal, AccountItem</li>
                      <li><strong>State Management:</strong> React Query handles server state, local useState for UI state</li>
                      <li><strong>Error Handling:</strong> Toast notifications for success/error feedback</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">User Flow</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li>1. Click "Add Connection" button to open bank selection modal</li>
                      <li>2. Search and select bank from available institutions</li>
                      <li>3. Complete bank authorization in new tab</li>
                      <li>4. Return to see new requisition card with connected accounts</li>
                      <li>5. Toggle sync switches to control transaction synchronization</li>
                      <li>6. View account details and balances by clicking accounts</li>
                      <li>7. Reconfirm connection if expired using reconfirm button</li>
                    </ul>
                  </section>
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}