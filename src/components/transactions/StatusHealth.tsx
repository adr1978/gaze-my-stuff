/**
 * StatusHealth Component
 * 
 * Displays the status of the most recent sync run with:
 * - Large status badge (Success/Warning/Error)
 * - Last run timestamp
 * - Duration
 * - Quick summary of accounts processed and transactions synced
 * 
 * Positioned below the stats cards, provides at-a-glance health monitoring
 */

import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import type { SyncStats, SyncRun } from "./types";

interface StatusHealthProps {
  /** Stats data from API (for last run info) */
  stats: SyncStats | undefined;
  /** Most recent sync run data (from logs endpoint) */
  latestRun: SyncRun | undefined;
  /** Loading state */
  isLoading: boolean;
}

export function StatusHealth({
  stats,
  latestRun,
  isLoading,
}: StatusHealthProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || !latestRun) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>No recent sync runs available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine status icon and colour based on run status
  const statusConfig = {
    success: {
      icon: CheckCircle2,
      colour: "text-emerald-600 dark:text-emerald-400",
      bgColour: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColour: "border-emerald-200 dark:border-emerald-800",
      label: "Success",
    },
    warning: {
      icon: AlertCircle,
      colour: "text-amber-600 dark:text-amber-400",
      bgColour: "bg-amber-50 dark:bg-amber-950/30",
      borderColour: "border-amber-200 dark:border-amber-800",
      label: "Warning",
    },
    error: {
      icon: XCircle,
      colour: "text-rose-600 dark:text-rose-400",
      bgColour: "bg-rose-50 dark:bg-rose-950/30",
      borderColour: "border-rose-200 dark:border-rose-800",
      label: "Error",
    },
  };

  const config = statusConfig[latestRun.status];
  const StatusIcon = config.icon;

  // Calculate summary statistics
  const totalTransactions = latestRun.accounts_processed.reduce(
    (sum, account) =>
      sum + account.transactions_pending + account.transactions_booked,
    0
  );

  const accountsProcessed = latestRun.accounts_processed.length;
  const failedAccounts = latestRun.accounts_processed.filter(
    (account) => account.fetch_status === "error"
  ).length;

  return (
    <Card className={`border-2 ${config.borderColour} ${config.bgColour}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Status Badge and Icon */}
          <div className="flex items-center gap-4">
            <div
              className={`h-14 w-14 rounded-lg ${config.bgColour} border ${config.borderColour} flex items-center justify-center`}
            >
              <StatusIcon className={`h-7 w-7 ${config.colour}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={
                    latestRun.status === "success"
                      ? "default"
                      : latestRun.status === "warning"
                      ? "secondary"
                      : "destructive"
                  }
                  className="font-semibold"
                >
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Run ID: {latestRun.run_id}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Last run:{" "}
                {formatDistanceToNow(new Date(latestRun.timestamp), {
                  addSuffix: true,
                })}{" "}
                •{" "}
                {format(
                  new Date(latestRun.timestamp),
                  "HH:mm:ss 'on' dd MMM yyyy"
                )}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {(latestRun.duration_ms / 1000).toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-foreground">
            {accountsProcessed} account{accountsProcessed !== 1 ? "s" : ""}{" "}
            processed
            {failedAccounts > 0 && (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {" "}
                ({failedAccounts} failed)
              </span>
            )}{" "}
            • {totalTransactions} transaction{totalTransactions !== 1 ? "s" : ""}{" "}
            synced
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
