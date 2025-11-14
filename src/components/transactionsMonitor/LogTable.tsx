import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogRow } from "./LogRow";
import type { SyncRun, AccountSync } from "./types";

interface LogTableProps {
  runs: SyncRun[];
  isLoading: boolean;
}

// Flatten runs into accounts for display
interface AccountWithTimestamp extends AccountSync {
  timestamp: string;
}

export function LogTable({ runs, isLoading }: LogTableProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  // Flatten all accounts from all runs
  const accounts: AccountWithTimestamp[] = runs.flatMap((run) =>
    run.accounts_processed.map((account) => ({
      ...account,
      timestamp: run.timestamp,
    }))
  );

  const toggleExpanded = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full mb-3" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>No sync runs found for this filter</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Frozen header row */}
        <div className="sticky top-0 z-10 bg-muted/50 border-b border-border backdrop-blur-sm">
          <div className="grid grid-cols-[80px_1fr_200px_120px] gap-4 px-4 py-3">
            <div className="text-xs font-semibold text-muted-foreground">Date</div>
            <div className="text-xs font-semibold text-muted-foreground">Owner</div>
            <div className="text-xs font-semibold text-muted-foreground">Stats</div>
            <div className="text-xs font-semibold text-muted-foreground text-right">Overall Status</div>
          </div>
        </div>
        
        {/* Scrollable table content */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="divide-y divide-border">
            {accounts.map((account) => (
              <LogRow
                key={account.account_id}
                account={account}
                isExpanded={expandedAccounts.has(account.account_id)}
                onToggleExpand={() => toggleExpanded(account.account_id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
