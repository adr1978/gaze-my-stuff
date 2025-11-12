import { Building2, CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Account } from "@/lib/api"; // <-- IMPORT our central type

// We will use the main Account type, but add some mock data for the modal
type AccountDetails = Account & {
  // This is all the *mock* data we are adding for the details view
  lastSynced: string;
  transactionsProcessed: number;
  status: "healthy" | "warning" | "error";
  issues: Array<{
    type: "info" | "warning" | "error";
    message: string;
    timestamp: string;
  }>;
  syncLogs: Array<{
    timestamp: string;
    action: string;
    status: "success" | "error" | "info";
    details: string;
  }>;
}

interface AccountDetailsModalProps {
  account: AccountDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountDetailsModal({ account, open, onOpenChange }: AccountDetailsModalProps) {
  if (!account) return null;

  const statusConfig = {
    healthy: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  };

  const StatusIcon = statusConfig[account.status].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4 pr-14">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-full ${statusConfig[account.status].bg} flex items-center justify-center flex-shrink-0`}>
              <Building2 className={`h-6 w-6 ${statusConfig[account.status].color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* --- FIX THE PROPERTY NAMES --- */}
                <DialogTitle className="text-xl">
                  {account.institution_name} ****{account.last_four}
                </DialogTitle>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[account.status].bg}`}>
                  <StatusIcon className={`h-4 w-4 ${statusConfig[account.status].color}`} />
                  <span className={`text-sm font-medium capitalize ${statusConfig[account.status].color}`}>
                    {account.status}
                  </span>
                </div>
              </div>
              <DialogDescription className="flex items-center gap-2">
                {/* --- FIX THE PROPERTY NAMES --- */}
                <span>{account.account_type}</span>
                <Badge variant={account.sync_enabled ? "default" : "secondary"} className="rounded-full">
                  Sync {account.sync_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* The rest of this modal uses mock data (lastSynced, etc.) */}
        <ScrollArea className="max-h-[calc(85vh-120px)]">
           <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Sync Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Last Synced
                  </div>
                  <div className="text-lg font-semibold text-foreground">{account.lastSynced}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Transactions
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {account.transactionsProcessed.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            {/* ... (rest of the mock data display is fine) ... */}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}