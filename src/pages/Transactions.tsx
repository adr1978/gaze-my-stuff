import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSyncStats, fetchSyncLogs } from "@/lib/transactionsApi";
import { StatsOverview } from "@/components/transactions/StatsOverview";
import { LogFilters } from "@/components/transactions/LogFilters";
import { LogTable } from "@/components/transactions/LogTable";
import type { LogFilters as LogFiltersType } from "@/components/transactions/types";

export default function Transactions() {
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

  // Apply client-side filters for search and status
  const filteredLogs = logs?.filter((run) => {
    // Status filter
    if (filters.status !== "all" && run.status !== filters.status) {
      return false;
    }

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
  }) || [];

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
        <LogFilters filters={filters} onFiltersChange={setFilters} onRefresh={() => refetch()} />
        <LogTable runs={filteredLogs} isLoading={logsLoading} />
      </div>
    </div>
  );
}
