import { Building2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Account {
  id: string;
  institutionName: string;
  last4: string;
  type: string;
  syncEnabled: boolean;
}

interface AccountItemProps {
  account: Account;
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
          <div className="font-semibold text-foreground">
            {account.institutionName} ****{account.last4}
          </div>
          <div className="text-sm text-muted-foreground">Type: {account.type}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Label
          htmlFor={`sync-${account.id}`}
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Sync {account.syncEnabled ? "ON" : "OFF"}
        </Label>
        <Switch
          id={`sync-${account.id}`}
          checked={account.syncEnabled}
          onCheckedChange={onSyncToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
