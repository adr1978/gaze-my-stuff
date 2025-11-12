/**
 * InvestmentDocumentation Component
 * 
 * Displays comprehensive documentation about the Investments page design and features.
 * Provides detailed information about UI elements, functionality, and data management.
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

export function InvestmentDocumentation() {
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
          <DialogTitle>Investments Page - Design & Feature Documentation</DialogTitle>
          <DialogDescription>
            Comprehensive documentation for the Investments tracking system
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Design System Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Design System</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Color Palette:</strong> Uses semantic HSL color tokens from the design system (--primary, --secondary, --muted, --border, --foreground, --background)</li>
                <li><strong>Typography:</strong> System font stack with responsive sizing. Headers use bold weights (font-semibold, font-bold)</li>
                <li><strong>Spacing:</strong> Consistent padding and margins using Tailwind spacing scale (p-3, p-6, p-8, gap-4, gap-6)</li>
                <li><strong>Borders:</strong> All buttons and cards use rounded-md (0.375rem) for consistent corner radius</li>
                <li><strong>Cards:</strong> Shadcn Card component with subtle shadows, border-border, and hover:shadow-md transitions</li>
                <li><strong>Buttons:</strong> Primary buttons use bg-primary with text-primary-foreground. All have rounded-md styling</li>
                <li><strong>Interactive States:</strong> Hover effects on clickable items (hover:bg-muted/50), cursor-pointer for clickability</li>
              </ul>
            </section>

            {/* Page Structure Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Page Structure</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Container:</strong> max-w-7xl centered container with p-8 padding on bg-background</li>
                <li><strong>Header:</strong> Page title (text-4xl font-bold) with descriptive subtitle (text-muted-foreground)</li>
                <li><strong>Grid Layout:</strong> Three main cards stacked vertically with gap-6 spacing</li>
                <li><strong>Responsive:</strong> Grid adapts to mobile with grid-cols-1 on small screens, md:grid-cols-3 on larger screens</li>
              </ul>
            </section>

            {/* Account Selection Card */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Account Selection Card</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Purpose:</strong> Select which investment account to view and display key metrics</li>
                <li><strong>Dropdown:</strong> Shadcn Select component showing account name and owner</li>
                <li><strong>Metrics Display:</strong> Three-column grid showing Total Shares, Current Price, and Total Value</li>
                <li><strong>Data Source:</strong> Pulls from accountsData JSON stored in localStorage under 'investmentAccounts' key</li>
                <li><strong>Number Formatting:</strong> All numbers use toLocaleString('en-GB') with minimumFractionDigits and maximumFractionDigits for proper comma separation</li>
                <li><strong>Currency Display:</strong> GBP (£) symbol with formatted amounts (e.g., £119,383.79)</li>
                <li><strong>Icon:</strong> TrendingUp icon in success color next to Total Value to indicate growth</li>
              </ul>
            </section>

            {/* Chart Card Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Investment Chart Card</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Purpose:</strong> Visualise investment value over time with configurable intervals</li>
                <li><strong>Chart Library:</strong> Recharts library (LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Line)</li>
                <li><strong>Data Aggregation:</strong> Historical daily prices aggregated by selected interval (Week/Month/Year)</li>
                <li><strong>Interval Selector:</strong> Three-button toggle in top-right corner (Week, Month, Year) with active state styling</li>
                <li><strong>Week Interval:</strong> Groups data by week, displaying Friday as the representative day for each week</li>
                <li><strong>Month Interval:</strong> Groups by month, showing the last day of each month</li>
                <li><strong>Year Interval:</strong> Groups by year, showing the last day of each year</li>
                <li><strong>X-Axis:</strong> Date labels formatted based on interval (day/month for Week, month/year for Month, year for Year)</li>
                <li><strong>Y-Axis:</strong> Currency values with £ symbol and comma formatting</li>
                <li><strong>Line Styling:</strong> Primary color stroke (stroke="hsl(var(--primary))"), strokeWidth={2}, no dots except on hover</li>
                <li><strong>Active Dot:</strong> White fill (hsl(var(--background))) with blue outline (hsl(var(--primary))), strokeWidth={2}</li>
                <li><strong>Purchase Markers:</strong> Small dots plotted on the chart line wherever purchases occurred during that interval</li>
                <li><strong>Hover Tooltip:</strong> Custom tooltip showing date, total value, shares held, current price, and purchase details if any occurred in that period</li>
                <li><strong>Responsive:</strong> ResponsiveContainer ensures chart scales to card width, height fixed at 400px</li>
              </ul>
            </section>

            {/* Purchase History Card Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Purchase History Card</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Purpose:</strong> Display all historical share purchases for the selected account</li>
                <li><strong>List Display:</strong> Each purchase shown as a row with date and shares amount</li>
                <li><strong>Date Format:</strong> Long date format (e.g., "15 January 2024") using toLocaleDateString('en-GB')</li>
                <li><strong>Shares Format:</strong> Decimal number with 2 decimal places and comma separators</li>
                <li><strong>Hover State:</strong> Row background changes to bg-muted/50 on hover, cursor changes to pointer</li>
                <li><strong>Edit Icon:</strong> Pencil icon appears on right side of row on hover (opacity-0 to opacity-100 transition)</li>
                <li><strong>Click Action:</strong> Clicking a row opens the edit modal with that purchase's data pre-populated</li>
                <li><strong>Add Button:</strong> Full-width button at bottom of card to add new purchases</li>
                <li><strong>Data Source:</strong> Purchase data stored in accounts' purchases array in localStorage JSON</li>
              </ul>
            </section>

            {/* Add/Edit Purchase Modal Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Add/Edit Purchase Modal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Purpose:</strong> Create new purchases or edit existing ones</li>
                <li><strong>Trigger:</strong> Opens when "Add Purchase" button clicked or when purchase history row clicked</li>
                <li><strong>Title:</strong> Dynamic - shows "Add Purchase" for new or "Edit Purchase" for existing</li>
                <li><strong>Number of Shares Field:</strong> Numeric input with step="0.01" for decimal shares, placeholder "0.00"</li>
                <li><strong>Purchase Date Field:</strong> Custom DatePickerPopover component with calendar selection</li>
                <li><strong>Date Picker:</strong> Popover-based calendar using Shadcn Calendar component, displays selected date in "MMMM do, yyyy" format</li>
                <li><strong>Validation:</strong> Ensures shares amount is greater than 0 before allowing save</li>
                <li><strong>Action Buttons:</strong> Cancel (outline variant) and Save/Update (primary variant), both with rounded-md styling</li>
                <li><strong>Data Persistence:</strong> Saves to localStorage 'investmentAccounts' JSON on successful submission</li>
                <li><strong>Toast Notification:</strong> Shows success message when purchase is added or updated</li>
              </ul>
            </section>

            {/* Data Management Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Data Management</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Storage Method:</strong> localStorage with key 'investmentAccounts'</li>
                <li><strong>Data Structure:</strong> Array of FundAccount objects, each containing:</li>
                <li className="ml-4">- id: Unique account identifier</li>
                <li className="ml-4">- accountName: Display name (e.g., "Anthony ISA")</li>
                <li className="ml-4">- owner: Account owner name</li>
                <li className="ml-4">- fundName: Name of the investment fund</li>
                <li className="ml-4">- totalShares: Current total share holdings</li>
                <li className="ml-4">- purchases: Array of SharePurchase objects (id, date, shares)</li>
                <li className="ml-4">- historicalData: Array of daily price data (date, closePrice for weekdays only)</li>
                <li><strong>Initial Load:</strong> Checks localStorage first, falls back to mock data if empty</li>
                <li><strong>Data Updates:</strong> Any purchase addition/edit updates localStorage immediately</li>
                <li><strong>Calculations:</strong> Total value calculated as totalShares × current closePrice</li>
                <li><strong>Historical Aggregation:</strong> Daily data aggregated to Week/Month/Year intervals on-the-fly for chart display</li>
              </ul>
            </section>

            {/* Key Functionality Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Key Functionality</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Account Switching:</strong> Select dropdown changes active account, updates all metrics, chart, and purchase history</li>
                <li><strong>Interval Toggle:</strong> Chart interval buttons aggregate data differently (Week shows Fridays, Month shows month-end, Year shows year-end)</li>
                <li><strong>Purchase Tracking:</strong> All purchases recorded with date and shares amount, displayed in chronological order</li>
                <li><strong>Edit Capability:</strong> Click any purchase to modify shares amount or date, changes saved to localStorage</li>
                <li><strong>Visual Feedback:</strong> Hover states, toast notifications, and loading indicators provide user feedback</li>
                <li><strong>Value Calculation:</strong> Total portfolio value automatically calculated from shares × latest price</li>
                <li><strong>Chart Plotting:</strong> Purchase events plotted as dots on chart line when they occur within displayed interval</li>
              </ul>
            </section>

            {/* Component Architecture Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Component Architecture</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Main Component:</strong> src/pages/Investments.tsx - orchestrates all functionality</li>
                <li><strong>DatePickerPopover:</strong> src/components/investments/DatePickerPopover.tsx - reusable date selector</li>
                <li><strong>InvestmentDocumentation:</strong> src/components/investments/InvestmentDocumentation.tsx - this documentation modal</li>
                <li><strong>State Management:</strong> React useState hooks for selected account, modal state, form data, chart interval</li>
                <li><strong>Data Flow:</strong> localStorage → component state → rendered UI → user actions → localStorage</li>
                <li><strong>Helper Functions:</strong> formatCurrency, aggregateDataByInterval, getTotalSharesUpToDate, calculateTotalValueAtDate</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
