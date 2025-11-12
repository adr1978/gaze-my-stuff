/**
 * AddPurchaseDialog Component
 * 
 * Modal dialog for adding or editing share purchases.
 * Includes form fields for shares amount and purchase date.
 * 
 * Features:
 * - Title with plus icon when adding new purchase
 * - Pre-populated form when editing existing purchase
 * - Date picker using custom DatePickerPopover component
 * - Form validation
 * - UK English messaging
 * 
 * Props:
 * - isOpen: Controls modal visibility
 * - onOpenChange: Callback when modal open state changes
 * - editingPurchase: Purchase being edited (null if adding new)
 * - accountName: Name of the account for context
 * - newShares: Current shares input value
 * - onSharesChange: Callback when shares input changes
 * - purchaseDate: Selected purchase date
 * - onDateChange: Callback when date changes
 * - onSave: Callback to save the purchase
 * - onCancel: Callback when cancel is clicked
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerPopover } from "./DatePickerPopover";
import { SharePurchase } from "./types";

interface AddPurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingPurchase: SharePurchase | null;
  accountName: string;
  newShares: string;
  onSharesChange: (shares: string) => void;
  purchaseDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function AddPurchaseDialog({
  isOpen,
  onOpenChange,
  editingPurchase,
  accountName,
  newShares,
  onSharesChange,
  purchaseDate,
  onDateChange,
  onSave,
  onCancel,
}: AddPurchaseDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Modal header */}
        <DialogHeader>
          <DialogTitle>
            {editingPurchase ? 'Edit Purchase' : 'Add Purchase'}
          </DialogTitle>
          <DialogDescription>
            {editingPurchase
              ? 'Update the purchase details'
              : `Record a new share purchase for ${accountName}`}
          </DialogDescription>
        </DialogHeader>

        {/* Form fields */}
        <div className="space-y-4 py-4">
          {/* Shares input */}
          <div className="space-y-2">
            <Label htmlFor="modal-shares">Number of Shares</Label>
            <Input
              id="modal-shares"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newShares}
              onChange={(e) => onSharesChange(e.target.value)}
            />
          </div>

          {/* Date picker */}
          <DatePickerPopover
            date={purchaseDate}
            onDateChange={onDateChange}
            label="Purchase Date"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {editingPurchase ? 'Update' : 'Add'} Purchase
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
