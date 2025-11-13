import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSyncStats, fetchSyncLogs } from "@/lib/TransactionsApi";
import { StatsOverview } from "@/components/TransactionsMonitor/StatsOverview";
import { LogFilters } from "@/components/TransactionsMonitor/LogFilters";
import { LogTable } from "@/components/TransactionsMonitor/LogTable";
import type { LogFilters as LogFiltersType } from "@/components/TransactionsMonitor/types";

export default function TransactionsMonitor() {
  const [filters, setFilters] = useState<LogFiltersType>({
    date: new Date().toISOString().split('T')[0],
    accountId: "",
    searchQuery: "",
    status: "all",
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["syncStats"],
    queryFn: fetchSyncStats,
    refetchInterval: 30000,
  });

  const { data: logs, isLoading: logsLoading, refetch } = useQuery({
    queryKey: ["syncLogs", filters.date],
    queryFn: () => fetchSyncLogs(filters.date),
    refetchInterval: 30000,
  });

  // Apply client-side filters: status at account-level, search at run-level
  const filteredLogs = (logs || [])
    .filter((run) => {
      // Search filter (run ID, account names, or error messages)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesRunId = run.run_id.toLowerCase().includes(query);
        const matchesAccount = run.accounts_processed.some((acc) => 
          acc.owner.toLowerCase().includes(query) ||
          acc.institution_name.toLowerCase().includes(query) ||
          acc.last_four.includes(query)
        );
        const matchesError = run.accounts_processed.some((acc) => 
          acc.calls.some((call) => 
            call.error?.message?.toLowerCase().includes(query) ||
            call.error?.code?.toLowerCase().includes(query)
          )
        );
        if (!matchesRunId && !matchesAccount && !matchesError) {
          return false;
        }
      }
      return true;
    })
    .map((run) => {
      if (filters.status === "all") return run;
      const accountsFiltered = run.accounts_processed.filter((acc) => {
        const hasErrors = acc.summary.errors > 0;
        const hasWarnings = acc.summary.skipped > 0;
        if (filters.status === "error") return hasErrors;
        if (filters.status === "warning") return !hasErrors && hasWarnings;
        if (filters.status === "success") return !hasErrors && !hasWarnings;
        return true;
      });
      return { ...run, accounts_processed: accountsFiltered };
    })
    .filter((run) => run.accounts_processed.length > 0);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">TransactionsMonitor Monitor</h1>
          <p className="text-muted-foreground">
            Monitor automated bank sync jobs and Notion uploads
          </p>
        </div>

        <StatsOverview stats={stats} isLoading={statsLoading} />
        <LogFilters filters={filters} onFiltersChange={setFilters} onRefresh={() => refetch()} />
        <LogTable runs={filteredLogs} isLoading={logsLoading} />
      </div>
    </div>
  );
}
