import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSyncStats, fetchSyncLogs } from "@/lib/transactionsApi";
import { StatsOverview } from "@/components/transactionsMonitor/StatsOverview";
import { LogFilters } from "@/components/transactionsMonitor/LogFilters";
import { LogTable } from "@/components/transactionsMonitor/LogTable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { LogFilters as LogFiltersType } from "@/components/transactionsMonitor/types";

export default function TransactionsMonitor() {
  const [filters, setFilters] = useState<LogFiltersType>({
    date: '',
    accountId: "",
    searchQuery: "",
    status: "all",
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["syncStats"],
    queryFn: fetchSyncStats,
    refetchInterval: autoRefresh ? 3000 : false,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["syncLogs"],
    queryFn: () => fetchSyncLogs(),
    refetchInterval: autoRefresh ? 3000 : false,
  });

  useEffect(() => {
    if (!autoRefresh) {
      setCountdown(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 3 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    setCountdown(3);
  };

  // Apply client-side filters
  const filteredLogs = (logs || [])
    .filter((run) => {
      // Date filter - check if any account's first call matches the selected date
      if (filters.date) {
        const hasMatchingDate = run.accounts_processed.some((acc) => {
          if (acc.calls.length === 0) return false;
          const firstCallDate = new Date(acc.calls[0].timestamp);
          const displayDate = `${String(firstCallDate.getDate()).padStart(2, '0')}/${String(firstCallDate.getMonth() + 1).padStart(2, '0')}/${firstCallDate.getFullYear()}`;
          return displayDate === filters.date;
        });
        if (!hasMatchingDate) return false;
      }
      return true;
    })
    .map((run) => {
      // Search filter - filter accounts based on search query
      let accountsFiltered = run.accounts_processed;
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesRunId = run.run_id.toLowerCase().includes(query);
        
        // If run ID matches, keep all accounts; otherwise filter accounts
        if (!matchesRunId) {
          accountsFiltered = accountsFiltered.filter((acc) => {
            const matchesAccount = 
              acc.owner.toLowerCase().includes(query) ||
              acc.institution_name.toLowerCase().includes(query) ||
              acc.last_four.includes(query);
            const matchesError = acc.calls.some((call) => 
              call.error?.message?.toLowerCase().includes(query) ||
              call.error?.code?.toLowerCase().includes(query)
            );
            return matchesAccount || matchesError;
          });
        }
      }
      
      // Status filter
      if (filters.status !== "all") {
        accountsFiltered = accountsFiltered.filter((acc) => {
          const hasErrors = acc.summary.errors > 0;
          const hasWarnings = acc.summary.skipped > 0;
          if (filters.status === "error") return hasErrors;
          if (filters.status === "warning") return !hasErrors && hasWarnings;
          if (filters.status === "success") return !hasErrors && !hasWarnings;
          return true;
        });
      }
      
      return { ...run, accounts_processed: accountsFiltered };
    })
    .filter((run) => run.accounts_processed.length > 0);

  return (
    // 💡 FIX: Change from min-h-screen to h-screen and add flex
    <div className="h-screen bg-background p-8 flex flex-col">
      {/* 💡 FIX: Add wrapper to manage flex-grow */}
      <div className="max-w-7xl mx-auto w-full space-y-6 flex flex-col flex-grow min-h-0">
        <div className="relative mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">Transactions Monitor</h1>
          <p className="text-muted-foreground">
            Monitor automated transaction syncs to Notion
          </p>
          <div className="absolute right-0 bottom-0 flex items-center gap-3 px-4 py-2 rounded-md border border-border bg-background">
            <Label
              htmlFor="auto-refresh-transactions"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              <span className="inline-block w-[108px]">
                Auto refresh {autoRefresh ? `(${countdown}s)` : ''}
              </span>
            </Label>
            <Switch
              id="auto-refresh-transactions"
              checked={autoRefresh}
              onCheckedChange={handleToggleAutoRefresh}
            />
          </div>
        </div>

        {/* These components have fixed heights */}
        <StatsOverview stats={stats} isLoading={statsLoading} />
        <LogFilters filters={filters} onFiltersChange={setFilters} />
        
        {/* 💡 FIX: Add flex-grow and min-h-0 to the table's parent
            (or directly on the component if it's the last child) */}
        <div className="flex-grow min-h-0">
          <LogTable runs={filteredLogs} isLoading={logsLoading} />
        </div>
      </div>
    </div>
  );
}
