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

interface AccountDetails {
  id: string;
  institutionName: string;
  last4: string;
  type: string;
  syncEnabled: boolean;
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
                <DialogTitle className="text-xl">
                  {account.institutionName} ****{account.last4}
                </DialogTitle>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[account.status].bg}`}>
                  <StatusIcon className={`h-4 w-4 ${statusConfig[account.status].color}`} />
                  <span className={`text-sm font-medium capitalize ${statusConfig[account.status].color}`}>
                    {account.status}
                  </span>
                </div>
              </div>
              <DialogDescription className="flex items-center gap-2">
                <span>{account.type}</span>
                <Badge variant={account.syncEnabled ? "default" : "secondary"} className="rounded-full">
                  Sync {account.syncEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Sync Statistics */}
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

            {/* Issues & Warnings */}
            {account.issues.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Issues & Warnings</h3>
                <div className="space-y-2">
                  {account.issues.map((issue, index) => {
                    const issueColors = {
                      info: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
                      warning: "bg-warning/10 border-warning/30 text-warning",
                      error: "bg-destructive/10 border-destructive/30 text-destructive",
                    };
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${issueColors[issue.type]}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="text-sm font-medium flex-1">{issue.message}</div>
                          <div className="text-xs opacity-70">{issue.timestamp}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sync Logs */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Sync Logs</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {account.syncLogs.map((log, index) => {
                  const logColors = {
                    success: "text-success",
                    error: "text-destructive",
                    info: "text-muted-foreground",
                  };
                  return (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.timestamp}
                        </span>
                        <span className={`text-xs font-medium ${logColors[log.status]}`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-foreground font-medium">{log.action}</span>
                      </div>
                      <div className="text-xs text-muted-foreground pl-0">{log.details}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
