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
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-muted/70 p-1">
            <TabsTrigger value="design">Design Guide</TabsTrigger>
            <TabsTrigger value="notion">Notion Studio</TabsTrigger>
            <TabsTrigger value="recipe">Recipe Importer</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="bank">Bank Connections</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
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
                      It manages bank requisitions, displays account details, and controls transaction synchronisation.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Key Features</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Bank Selection:</strong> Modal interface for choosing banks from available institutions</li>
                      <li><strong>Requisition Cards:</strong> Display connected banks with status indicators and account lists</li>
                      <li><strong>Account Details:</strong> View balances, account numbers, and transaction sync status</li>
                      <li><strong>Sync Control:</strong> Toggle transaction synchronisation per account with API integration</li>
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
                      <li>5. Toggle sync switches to control transaction synchronisation</li>
                      <li>6. View account details and balances by clicking accounts</li>
                      <li>7. Reconfirm connection if expired using reconfirm button</li>
                    </ul>
                  </section>
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Transaction Sync System Documentation */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Transaction Sync System</h2>
              <p className="text-muted-foreground mb-6">
                Automated bank transaction synchronisation with Notion database integration and comprehensive monitoring dashboard
              </p>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-6 pr-4">
                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">System Overview</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      The Transaction Sync System is an automated workflow that fetches bank transactions from GoCardless, 
                      enriches the data with custom processing logic, and uploads formatted records to a Notion database. 
                      The dashboard provides real-time monitoring of sync operations with detailed logging and debugging capabilities.
                    </p>
                    <div className="bg-muted/30 border border-border rounded-md p-4 mt-4">
                      <p className="text-sm font-semibold mb-2">Architecture Flow:</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Cron Scheduler → fetch_transactions.py → GoCardless API → Data Enrichment → 
                        enrich_and_upload.py → Notion API → Log Files → Dashboard Display
                      </p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Dashboard Features</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li><strong>Stats Overview:</strong> Four key metric cards showing transactions today, next scheduled run, 7-day success rate, and active connections</li>
                      <li><strong>Status Health:</strong> Large status indicator with last run information and duration</li>
                      <li><strong>Log Filters:</strong> Date picker, status dropdown (all/success/warning/error), and search functionality</li>
                      <li><strong>Expandable Log Table:</strong> Parent rows (bank fetch) with nested child rows (Notion uploads)</li>
                      <li><strong>Auto-Expand Errors:</strong> Notion upload rows automatically expand when errors occur</li>
                      <li><strong>Log Details Modal:</strong> Full request/response debugging data with syntax highlighting</li>
                      <li><strong>Auto-Refresh:</strong> 30-second polling interval for live updates</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Data Structure & Storage</h3>
                    <div className="space-y-3 text-muted-foreground text-sm">
                      <div>
                        <p className="font-semibold text-foreground mb-2">Daily Log Files:</p>
                        <p className="mb-2">Location: <code className="text-xs bg-muted px-1 py-0.5 rounded">api/data/transactions/logs/YYYY-MM-DD.json</code></p>
                        <p className="mb-2">Each file contains an array of sync runs with nested account processing details:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Run metadata (run_id, timestamp, status, duration)</li>
                          <li>Account fetch results (status, HTTP code, transaction counts, errors)</li>
                          <li>Notion upload results (status, uploaded count, duration, errors)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Summary File:</p>
                        <p className="mb-2">Location: <code className="text-xs bg-muted px-1 py-0.5 rounded">api/data/transactions/summary.json</code></p>
                        <p>Contains aggregated statistics: today's totals, last/next run times, success rates</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Configuration File:</p>
                        <p className="mb-2">Location: <code className="text-xs bg-muted px-1 py-0.5 rounded">api/data/transactions/config.json</code></p>
                        <p>Stores cron schedule, enabled accounts, timezone settings</p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Python Scripts Architecture</h3>
                    <div className="space-y-3 text-muted-foreground text-sm">
                      <div>
                        <p className="font-semibold text-foreground mb-2">fetch_transactions.py:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Main orchestration script triggered by cron</li>
                          <li>Loads enabled accounts from config.json</li>
                          <li>Fetches transactions from GoCardless API for each account</li>
                          <li>Calls enrich_and_upload.py for each account's transaction set</li>
                          <li>Writes detailed logs to daily log files</li>
                          <li>Updates summary.json with aggregated statistics</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">enrich_and_upload.py:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Receives raw GoCardless transaction data</li>
                          <li>Enriches transactions with custom business logic (categorisation, merchant mapping, etc.)</li>
                          <li>Formats data according to Notion database schema</li>
                          <li>Uploads formatted records to Notion API</li>
                          <li>Returns upload results (success count, errors) to caller</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Script Locations:</p>
                        <p className="mb-1"><code className="text-xs bg-muted px-1 py-0.5 rounded">api/scripts/fetch_transactions.py</code></p>
                        <p><code className="text-xs bg-muted px-1 py-0.5 rounded">api/scripts/enrich_and_upload.py</code></p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">API Endpoints</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      FastAPI backend running on <code className="text-xs bg-muted px-1 py-0.5 rounded">http://192.168.1.70:6059</code>
                    </p>
                    <div className="space-y-3 text-muted-foreground text-sm">
                      <div className="bg-muted/30 border border-border rounded-md p-3">
                        <p className="font-semibold text-foreground mb-1">GET /api/transactions/stats</p>
                        <p className="text-xs mb-2">Returns summary statistics for dashboard overview</p>
                        <p className="text-xs"><strong>Response:</strong> SyncStats object with today's metrics and 7-day success rate</p>
                      </div>
                      <div className="bg-muted/30 border border-border rounded-md p-3">
                        <p className="font-semibold text-foreground mb-1">GET /api/transactions/logs?date=YYYY-MM-DD&limit=20</p>
                        <p className="text-xs mb-2">Returns paginated log entries for specified date</p>
                        <p className="text-xs"><strong>Response:</strong> Array of SyncRun objects with account processing details</p>
                      </div>
                      <div className="bg-muted/30 border border-border rounded-md p-3">
                        <p className="font-semibold text-foreground mb-1">GET /api/transactions/logs/{"{run_id}"}</p>
                        <p className="text-xs mb-2">Returns detailed request/response data for specific run</p>
                        <p className="text-xs"><strong>Response:</strong> LogDetails object with full API debugging information</p>
                      </div>
                      <div className="bg-muted/30 border border-border rounded-md p-3">
                        <p className="font-semibold text-foreground mb-1">GET /api/transactions/config</p>
                        <p className="text-xs mb-2">Returns cron schedule and enabled account configuration</p>
                        <p className="text-xs"><strong>Response:</strong> SyncConfig object with schedule details</p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Integration Steps: Live API Setup</h3>
                    <div className="space-y-4 text-muted-foreground text-sm">
                      <div className="bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 rounded-md p-4">
                        <p className="font-semibold text-amber-900 dark:text-amber-200 mb-2">⚠️ Current State: Dummy Data</p>
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          All endpoints currently return dummy/fallback data. Follow these steps to connect live APIs.
                        </p>
                      </div>
                      
                      <div>
                        <p className="font-semibold text-foreground mb-2">Step 1: Configure GoCardless Credentials</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Obtain GoCardless API secret key from dashboard</li>
                          <li>Add to environment variables or config file</li>
                          <li>Update fetch_transactions.py to use real credentials</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Step 2: Configure Notion Integration</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Create Notion integration at <a href="https://www.notion.so/my-integrations" className="text-primary hover:underline">notion.so/my-integrations</a></li>
                          <li>Copy internal integration secret</li>
                          <li>Share target database with integration</li>
                          <li>Update enrich_and_upload.py with database ID and secret</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Step 3: Set Up Cron Scheduling</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Edit crontab on QNAP NAS or within Docker container</li>
                          <li>Example: <code className="text-xs bg-muted px-1 py-0.5 rounded">0 */6 * * * /path/to/fetch_transactions.py</code></li>
                          <li>Ensure script has execute permissions</li>
                          <li>Update config.json with matching cron schedule</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Step 4: Enable Accounts for Sync</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Edit config.json enabled_accounts array</li>
                          <li>Add account IDs from gc_metadata.json</li>
                          <li>Verify accounts have sync_enabled: true in Bank Connections page</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Step 5: Test End-to-End</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Run fetch_transactions.py manually first</li>
                          <li>Check daily log files for errors</li>
                          <li>Verify transactions appear in Notion database</li>
                          <li>Confirm dashboard displays real data</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Step 6: Set Up Error Notifications (Optional)</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Configure SMTP settings in Python scripts</li>
                          <li>Add email notification on fetch/upload failures</li>
                          <li>Include error details and run_id in email body</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Email Notifications</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Automated email alerts for transaction sync failures and daily summary reports with beautifully designed HTML templates featuring the Broomfield crest.
                    </p>
                    <div className="space-y-4 text-muted-foreground text-sm">
                      <div>
                        <p className="font-semibold text-foreground mb-2">Configuration (.env settings):</p>
                        <div className="bg-muted/30 border border-border rounded-md p-3 font-mono text-xs space-y-1">
                          <p>SMTP_HOST="smtp.gmail.com"</p>
                          <p>SMTP_PORT="587"</p>
                          <p>SMTP_USERNAME="your-email@gmail.com"</p>
                          <p>SMTP_PASSWORD="your-app-password"</p>
                          <p>SMTP_FROM_EMAIL="your-email@gmail.com"</p>
                          <p>SMTP_TO_EMAIL="recipient@example.com"</p>
                          <p className="pt-2">EMAIL_NOTIFICATIONS_ENABLED="true"</p>
                          <p>EMAIL_IMMEDIATE_ERRORS="true"</p>
                          <p>EMAIL_DAILY_DIGEST="true"</p>
                          <p>EMAIL_DAILY_DIGEST_TIME="18:00"</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Email Types:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>
                            <strong className="text-foreground">Immediate Error Alerts:</strong> Sent when GoCardless fetch fails or Notion upload encounters errors. 
                            Features red/urgent styling with 🚨 icon, detailed error information, and affected account details.
                          </li>
                          <li>
                            <strong className="text-foreground">Daily Digest:</strong> Scheduled summary email sent at configured time (default 6pm). 
                            Shows stats overview with ✅ success indicators, transaction counts, run summaries, and performance metrics.
                          </li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Email Design Features:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Hero Image:</strong> Broomfield crest displayed at top (hosted at hub.broomfield.family)</li>
                          <li><strong>Color Scheme:</strong> Uses design system colors - primary blue (#4B9BFF), success green, destructive red, warning orange</li>
                          <li><strong>Responsive Layout:</strong> Card-based HTML design with proper spacing and typography</li>
                          <li><strong>Status Icons:</strong> Visual indicators (🚨, 📊, ✅, ⚠️, ✗) for quick status recognition</li>
                          <li><strong>Call-to-Actions:</strong> Color-coded buttons linking to dashboard for detailed analysis</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Testing Email Notifications:</p>
                        <ol className="list-decimal pl-6 space-y-2">
                          <li>Configure SMTP settings in .env file (see configuration above)</li>
                          <li>Set EMAIL_NOTIFICATIONS_ENABLED="true"</li>
                          <li>Run test script: <code className="bg-muted px-1 py-0.5 rounded">python api/scripts/test_email_notifications.py</code></li>
                          <li>Check inbox for both immediate error alert and daily digest samples</li>
                          <li>Review email design and content formatting</li>
                        </ol>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">Implementation Files:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><code className="text-xs bg-muted px-1 py-0.5 rounded">api/banking_transactions/email_notifications.py</code> - Email sending logic and HTML templates</li>
                          <li><code className="text-xs bg-muted px-1 py-0.5 rounded">api/scripts/test_email_notifications.py</code> - Test script for sending sample emails</li>
                          <li><code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> - SMTP and notification configuration</li>
                        </ul>
                      </div>

                      <div className="bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 rounded-md p-4 mt-3">
                        <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Gmail App Passwords</p>
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          If using Gmail, you must create an App Password (not your regular password). 
                          Visit Google Account → Security → 2-Step Verification → App Passwords to generate one.
                        </p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Component Architecture</h3>
                    <div className="space-y-2 text-muted-foreground text-sm">
                      <p className="font-semibold text-foreground mb-2">Frontend Components:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/pages/Transactions.tsx</code> - Main page orchestrator with React Query integration</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/transactions/StatsOverview.tsx</code> - Four metric cards with icons</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/transactions/StatusHealth.tsx</code> - Health indicator with last run info</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/transactions/LogFilters.tsx</code> - Date, status, search filters</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/transactions/LogTable.tsx</code> - Table wrapper with pagination</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/transactions/LogRow.tsx</code> - Expandable parent row (bank fetch)</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/transactions/NotionUploadRow.tsx</code> - Child row (Notion upload)</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/transactions/LogDetailsModal.tsx</code> - Full debugging modal with JSON</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/lib/transactionsApi.ts</code> - API client with typed functions</li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/transactions/types.ts</code> - TypeScript interfaces</li>
                      </ul>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Troubleshooting Common Issues</h3>
                    <div className="space-y-3 text-muted-foreground text-sm">
                      <div>
                        <p className="font-semibold text-foreground mb-1">Dashboard shows "No sync runs found":</p>
                        <ul className="list-disc pl-6">
                          <li>Verify daily log file exists for selected date</li>
                          <li>Check FastAPI backend is running on port 6059</li>
                          <li>Inspect browser console for API errors</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">GoCardless fetch fails with 401:</p>
                        <ul className="list-disc pl-6">
                          <li>Access token has expired - need to reconfirm requisition</li>
                          <li>Visit Bank Connections page and click "Reconfirm" button</li>
                          <li>Complete bank authentication flow</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">Notion upload fails with 503 (rate limited):</p>
                        <ul className="list-disc pl-6">
                          <li>Notion API has rate limits (3 requests/second)</li>
                          <li>Add throttling/retry logic in enrich_and_upload.py</li>
                          <li>Consider batch processing in larger groups</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">Duplicate transactions in Notion:</p>
                        <ul className="list-disc pl-6">
                          <li>Implement deduplication logic using transaction IDs</li>
                          <li>Query Notion before uploading to check for existing entries</li>
                          <li>Use GoCardless transaction_id as unique identifier</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">Cron job not executing:</p>
                        <ul className="list-disc pl-6">
                          <li>Check cron service is running: <code className="text-xs bg-muted px-1 py-0.5 rounded">systemctl status cron</code></li>
                          <li>Verify script has execute permissions</li>
                          <li>Check cron logs: <code className="text-xs bg-muted px-1 py-0.5 rounded">/var/log/cron</code></li>
                        </ul>
                      </div>
                    </div>
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