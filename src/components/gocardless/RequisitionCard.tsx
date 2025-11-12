import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountItem } from "./AccountItem";
import { AccountDetailsModal } from "./AccountDetailsModal";

interface Account {
  id: string;
  institutionName: string;
  last4: string;
  type: string;
  syncEnabled: boolean;
}

interface Requisition {
  id: string;
  reference: string;
  owner: string;
  created: string;
  status: string;
  expiresInDays: number;
  accounts: Account[];
}

interface RequisitionCardProps {
  requisition: Requisition;
  onSyncToggle: (requisitionId: string, accountId: string, enabled: boolean) => void;
  onReconfirm: (requisitionId: string) => void;
}

export function RequisitionCard({ requisition, onSyncToggle, onReconfirm }: RequisitionCardProps) {
  const isExpiringSoon = requisition.expiresInDays <= 30;
  const hasAccounts = requisition.accounts.length > 0;
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleAccountClick = (account: Account) => {
    // Mock detailed data for demonstration
    const detailedAccount = {
      ...account,
      lastSynced: "2 hours ago",
      transactionsProcessed: 1247,
      status: account.syncEnabled ? ("healthy" as const) : ("warning" as const),
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
        {
          timestamp: "2025-01-05 12:00:15",
          action: "Sync Started",
          status: "info" as const,
          details: "Initiated scheduled sync process",
        },
        {
          timestamp: "2025-01-04 18:45:10",
          action: "Sync Completed",
          status: "success" as const,
          details: "Successfully synced 15 new transactions",
        },
        {
          timestamp: "2025-01-04 15:30:05",
          action: "Connection Test",
          status: "success" as const,
          details: "Bank connection verified successfully",
        },
      ],
    };
    setSelectedAccount(detailedAccount);
    setIsDetailsOpen(true);
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with main info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {requisition.reference}
                </h3>
                <Badge variant="secondary" className="rounded-full">
                  {requisition.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Owner: </span>
                  <span className="text-primary font-medium">{requisition.owner}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="text-foreground">{requisition.created}</span>
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

          {/* Expiry warning */}
          {isExpiringSoon && (
            <div className="flex items-center gap-3 bg-warning/5 border border-warning/30 rounded-lg px-4 py-2.5">
              <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">
                You can reconfirm this connection now to extend access
              </span>
              <Button
                onClick={() => onReconfirm(requisition.id)}
                className="bg-warning hover:bg-warning/90 text-white shadow-sm rounded-md font-medium flex-shrink-0"
                size="sm"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reconfirm
              </Button>
            </div>
          )}

          {/* Accounts list */}
          {hasAccounts && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">Account Details:</h4>
              <div className="space-y-3">
                {requisition.accounts.map((account) => (
                  <AccountItem
                    key={account.id}
                    account={account}
                    onSyncToggle={(enabled) =>
                      onSyncToggle(requisition.id, account.id, enabled)
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
