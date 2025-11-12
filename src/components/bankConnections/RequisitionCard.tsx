import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountItem } from "./AccountItem";
import { AccountDetailsModal } from "./AccountDetailsModal";
import { Account, Requisition } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RequisitionCardProps {
  requisition: Requisition;
  onSyncToggle: (requisitionId: string, accountId: string, enabled: boolean) => void;
  onReconfirm: (agreementId: string) => void;
}

// --- Status Mapping & Coloring ---
const statusMap: { [key: string]: string } = {
  CR: "CREATED",
  GC: "GIVING CONSENT",
  UA: "UNDERGOING AUTHENTICATION",
  RJ: "REJECTED",
  SA: "SELECTING ACCOUNTS",
  GA: "GRANTING ACCESS",
  LN: "LINKED",
  EX: "EXPIRED",
  SU: "SUSPENDED",
  ID: "IDENTIFICATION REQUIRED",
};

const getStatusClass = (status: string) => {
  if (status === "LN") {
    // Green (like 'healthy' pill)
    return "bg-success/10 text-success border-transparent hover:bg-success/20";
  }
  if (status === "EX") {
    // Red (like 'error' pill)
    return "bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20";
  }
  // Orange (like 'warning' pill)
  return "bg-warning/10 text-warning border-transparent hover:bg-warning/20";
};
// --- End of Status Logic ---

export function RequisitionCard({ requisition, onSyncToggle, onReconfirm }: RequisitionCardProps) {
  const isExpiringSoon = requisition.expiresInDays <= 30;
  const hasAccounts = requisition.accounts.length > 0;
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const displayStatus = statusMap[requisition.status] || requisition.status;

  const handleAccountClick = (account: Account) => {
    const detailedAccount = {
      ...account,
      institutionName: account.institution_name,
      last4: account.last_four,
      type: account.account_type,
      syncEnabled: account.sync_enabled,
      id: account.account_id,
      lastSynced: "2 hours ago",
      transactionsProcessed: 1247,
      status: account.sync_enabled ? ("healthy" as const) : ("warning" as const),
      issues: [
        {
          type: "info" as const,
          message: "Regular sync completed successfully",
          timestamp: "2 hours ago",
        },
      ],
      syncLogs: [
        {
          timestamp: "2025-01-05 15:30:22",
          action: "Sync Completed",
          status: "success" as const,
          details: "Successfully synced 23 new transactions",
        },
        // ... (other logs)
      ],
    };

    setSelectedAccount(detailedAccount);
    setIsDetailsOpen(true);
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {requisition.reference}
                </h3>
                {/* --- UPDATED BADGE --- */}
                <Badge
                  variant="outline" // Use outline to remove default background
                  className={cn("rounded-full", getStatusClass(requisition.status))}
                >
                  {displayStatus}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Owner: </span>
                  <span className="text-primary font-medium">{requisition.owner}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="text-foreground">{new Date(requisition.created).toLocaleDateString()}</span>
                </div>
                {hasAccounts && (
                  <div>
                    <span className="text-muted-foreground">Accounts: </span>
                    <span className="text-foreground font-medium">{requisition.accounts.length} connected</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Expires in: </span>
                  <span className={`text-foreground font-medium ${isExpiringSoon ? 'text-warning' : ''}`}>
                    {requisition.expiresInDays} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isExpiringSoon && (
            <div className="flex items-center gap-3 bg-warning/5 border border-warning/30 rounded-lg px-4 py-2.5">
              <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">
                You can reconfirm this connection now to extend access
              </span>
              <Button
                onClick={() => onReconfirm(requisition.agreement)}
                className="bg-warning hover:bg-warning/90 text-white shadow-sm rounded-full font-medium flex-shrink-0"
                size="sm"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reconfirm
              </Button>
            </div>
          )}

          {hasAccounts && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">Account Details:</h4>
              <div className="space-y-3">
                {requisition.accounts.map((account) => (
                  <AccountItem
                    key={account.account_id}
                    account={account}
                    onSyncToggle={(enabled) =>
                      onSyncToggle(requisition.id, account.account_id, enabled)
                    }
                    onClick={() => handleAccountClick(account)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <AccountDetailsModal
        account={selectedAccount}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </Card>
  );
}