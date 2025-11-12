import { Building2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Account } from "@/lib/api"; // <-- IMPORT our central type

// We no longer need the local "Account" interface here

interface AccountItemProps {
  account: Account; // <-- USE the imported type
  onSyncToggle: (enabled: boolean) => void;
  onClick?: () => void;
}

export function AccountItem({ account, onSyncToggle, onClick }: AccountItemProps) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-border hover:bg-muted/40 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          {/* --- FIX THE PROPERTY NAMES --- */}
          <div className="font-semibold text-foreground">
            {account.institution_name} ****{account.last_four}
          </div>
          <div className="text-sm text-muted-foreground">Type: {account.account_type}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Label
          htmlFor={`sync-${account.account_id}`} // <-- FIX THE ID
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Sync {account.sync_enabled ? "ON" : "OFF"}
        </Label>
        <Switch
          id={`sync-${account.account_id}`} // <-- FIX THE ID
          checked={account.sync_enabled}
          onCheckedChange={onSyncToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}