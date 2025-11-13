import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSyncStats, fetchSyncLogs } from "@/lib/transactionsApi";
import { StatsOverview } from "@/components/transactionsMonitor/StatsOverview";
import { LogFilters } from "@/components/transactionsMonitor/LogFilters";
import { LogTable } from "@/components/transactionsMonitor/LogTable";
import type { LogFilters as LogFiltersType } from "@/components/transactionsMonitor/types";

export default function TransactionsMonitor() {
  const [filters, setFilters] = useState<LogFiltersType>({
    date: '',
    accountId: "",
    searchQuery: "",
    status: "all",
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["syncStats"],
    queryFn: fetchSyncStats,
    refetchInterval: 30000,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["syncLogs"],
    queryFn: () => fetchSyncLogs(),
    refetchInterval: 30000,
  });

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Transactions Monitor</h1>
          <p className="text-muted-foreground">
            Monitor automated bank sync jobs and Notion uploads
          </p>
        </div>

        <StatsOverview stats={stats} isLoading={statsLoading} />
        <LogFilters filters={filters} onFiltersChange={setFilters} />
        <LogTable runs={filteredLogs} isLoading={logsLoading} />
      </div>
    </div>
  );
}
