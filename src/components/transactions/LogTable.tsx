import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogRow } from "./LogRow";
import type { SyncRun } from "./types";

interface LogTableProps {
  runs: SyncRun[];
  isLoading: boolean;
}

export function LogTable({ runs, isLoading }: LogTableProps) {
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());

  const toggleExpanded = (runId: string) => {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
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

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>No sync runs found for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {runs.map((run) => (
            <LogRow
              key={run.run_id}
              run={run}
              isExpanded={expandedRuns.has(run.run_id)}
              onToggleExpand={() => toggleExpanded(run.run_id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
