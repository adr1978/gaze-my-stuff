import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSyncStats, fetchSyncLogs } from "@/lib/transactionsApi";
import { StatsOverview } from "@/components/transactions/StatsOverview";
import { StatusHealth } from "@/components/transactions/StatusHealth";
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            Monitor automated bank sync jobs and Notion uploads
          </p>
        </div>

        <StatsOverview stats={stats} isLoading={statsLoading} />
        <StatusHealth stats={stats} latestRun={logs?.[0]} isLoading={statsLoading || logsLoading} />
        <LogFilters filters={filters} onFiltersChange={setFilters} onRefresh={() => refetch()} />
        <LogTable runs={logs || []} isLoading={logsLoading} />
      </div>
    </div>
  );
}
