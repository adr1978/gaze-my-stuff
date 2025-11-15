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
  uniqueKey: string;
}

export function LogTable({ runs, isLoading }: LogTableProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  // Flatten all accounts from all runs with unique keys
  const accounts: AccountWithTimestamp[] = runs.flatMap((run) =>
    run.accounts_processed.map((account) => ({
      ...account,
      timestamp: run.timestamp,
      uniqueKey: `${run.timestamp}-${account.account_id}`, // Unique key per row
    }))
  );

  const toggleExpanded = (uniqueKey: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(uniqueKey)) {
        next.delete(uniqueKey);
      } else {
        next.add(uniqueKey);
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
    // 💡 FIX: Make the Card fill its new flex-grow parent
    <Card className="h-full flex flex-col">
      {/* 💡 FIX: Make CardContent a flex container that fills height */}
      <CardContent className="p-0 h-full flex flex-col">
        {/* Frozen header row (fixed height) */}
        <div className="sticky top-0 z-10 bg-secondary border-b border-border backdrop-blur-sm">
          <div className="grid grid-cols-[150px_1fr_1fr_200px_120px] gap-4 px-4 py-3">
            <div className="text-xs font-semibold text-muted-foreground ml-6">Date</div>
            <div className="text-xs font-semibold text-muted-foreground">Owner</div>
            <div className="text-xs font-semibold text-muted-foreground">Account</div>
            <div className="text-xs font-semibold text-muted-foreground">Stats</div>
            <div className="text-xs font-semibold text-muted-foreground text-right">Overall Status</div>
          </div>
        </div>
        
        {/* 💡 FIX: Remove calc() and use flex-1 to fill remaining space */}
        <ScrollArea className="h-full flex-1">
          <div className="divide-y divide-border">
            {accounts.map((account) => (
              <LogRow
                key={account.uniqueKey}
                account={account}
                isExpanded={expandedAccounts.has(account.uniqueKey)}
                onToggleExpand={() => toggleExpanded(account.uniqueKey)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
