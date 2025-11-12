/**
 * PurchaseHistoryCard Component
 * 
 * Displays a list of all share purchases for the selected account.
 * Each purchase is clickable to open the edit modal.
 * Includes an "Add Purchase" button at the bottom.
 * 
 * Features:
 * - Formatted dates using "MMMM do, yyyy" format (e.g., "November 12th, 2025")
 * - Hover effects to show edit icon
 * - Formatted share amounts with 2 decimal places
 * - Add button with plus icon
 * 
 * Props:
 * - accountName: Name of the current account
 * - purchases: Array of purchase transactions
 * - onEditPurchase: Callback when a purchase is clicked for editing
 * - onAddPurchase: Callback when Add Purchase button is clicked
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { SharePurchase } from "./types";

interface PurchaseHistoryCardProps {
  accountName: string;
  purchases: SharePurchase[];
  onEditPurchase: (purchase: SharePurchase) => void;
  onAddPurchase: () => void;
}

/**
 * Format a number with comma separators and 2 decimal places
 * Example: 150.25 → 150.25
 */
function formatShares(shares: number): string {
  return shares.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PurchaseHistoryCard({
  accountName,
  purchases,
  onEditPurchase,
  onAddPurchase,
}: PurchaseHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase History</CardTitle>
        <CardDescription>All share purchases for {accountName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List of purchases */}
        <div className="space-y-2">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              onClick={() => onEditPurchase(purchase)}
              className="flex justify-between items-center p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group"
            >
              {/* Date formatted as "November 12th, 2025" using date-fns */}
              <span className="text-sm font-medium">
                {format(new Date(purchase.date), 'MMMM do, yyyy')}
              </span>
              
              {/* Share amount and edit icon */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {formatShares(purchase.shares)} shares
                </span>
                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>

        {/* Add Purchase button with plus icon */}
        <Button onClick={onAddPurchase}>
          <Plus className="h-4 w-4" />
          Add Purchase
        </Button>
      </CardContent>
    </Card>
  );
}
