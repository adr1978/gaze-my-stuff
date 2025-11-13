import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
      </CardContent>
    </Card>
  );
}
