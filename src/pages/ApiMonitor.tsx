import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonitorStats, fetchMonitorLogs } from "@/lib/apiMonitorApi";
import { StatsOverview } from "@/components/apiMonitor/StatsOverview";
import { LogFilters } from "@/components/apiMonitor/LogFilters";
import { LogTable } from "@/components/apiMonitor/LogTable";
import type { LogFilters as LogFiltersType } from "@/components/apiMonitor/types";

export default function ApiMonitor() {
  const [filters, setFilters] = useState<LogFiltersType>({
    date: '',
    category: "all",
    searchQuery: "",
    status: "all",
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["monitorStats"],
    queryFn: fetchMonitorStats,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["monitorLogs"],
    queryFn: () => fetchMonitorLogs(),
  });

  // Apply client-side filters
  const filteredLogs = (logs || [])
    .filter((run) => {
      // Date filter
      if (filters.date) {
        const hasMatchingDate = run.items_processed.some((item) => {
          if (item.calls.length === 0) return false;
          const firstCallDate = new Date(item.calls[0].timestamp);
          const displayDate = `${String(firstCallDate.getDate()).padStart(2, '0')}/${String(firstCallDate.getMonth() + 1).padStart(2, '0')}/${firstCallDate.getFullYear()}`;
          return displayDate === filters.date;
        });
        if (!hasMatchingDate) return false;
      }
      
      // Category filter
      if (filters.category !== "all" && run.category !== filters.category) {
        return false;
      }
      
      return true;
    })
    .map((run) => {
      let itemsFiltered = run.items_processed;
      
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesRunId = run.run_id.toLowerCase().includes(query);
        
        if (!matchesRunId) {
          itemsFiltered = itemsFiltered.filter((item) => {
            const matchesItem = 
              item.source.toLowerCase().includes(query) ||
              item.item_name.toLowerCase().includes(query);
            const matchesError = item.calls.some((call) => 
              call.error?.message?.toLowerCase().includes(query) ||
              call.error?.code?.toLowerCase().includes(query)
            );
            return matchesItem || matchesError;
          });
        }
      }
      
      // Status filter
      if (filters.status !== "all") {
        itemsFiltered = itemsFiltered.filter((item) => {
          const hasErrors = item.summary.errors > 0;
          const hasWarnings = item.summary.skipped > 0;
          if (filters.status === "error") return hasErrors;
          if (filters.status === "warning") return !hasErrors && hasWarnings;
          if (filters.status === "success") return !hasErrors && !hasWarnings;
          return true;
        });
      }
      
      return { ...run, items_processed: itemsFiltered };
    })
    .filter((run) => run.items_processed.length > 0);

  return (
    <div className="h-screen bg-background p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex flex-col flex-grow min-h-0">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">API Monitor</h1>
          <p className="text-muted-foreground">
            Monitor automated API sync jobs across all platforms
          </p>
        </div>

        <StatsOverview stats={stats} isLoading={statsLoading} />
        <LogFilters filters={filters} onFiltersChange={setFilters} />
        
        <div className="flex-grow min-h-0">
          <LogTable runs={filteredLogs} isLoading={logsLoading} />
        </div>
      </div>
    </div>
  );
}
