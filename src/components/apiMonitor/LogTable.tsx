import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogRow } from "./LogRow";
import type { ApiRun, ItemSync } from "./types";

interface ItemWithTimestamp extends ItemSync {
  timestamp: string;
  uniqueKey: string;
  category: string;
}

interface LogTableProps {
  runs: ApiRun[];
  isLoading: boolean;
}

export function LogTable({ runs, isLoading }: LogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpanded = (uniqueKey: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(uniqueKey)) {
        newSet.delete(uniqueKey);
      } else {
        newSet.add(uniqueKey);
      }
      return newSet;
    });
  };

  // Flatten runs into individual items with timestamps
  const flattenedItems: ItemWithTimestamp[] = runs.flatMap((run) =>
    run.items_processed.map((item, idx) => ({
      ...item,
      timestamp: run.timestamp,
      category: run.category,
      uniqueKey: `${run.run_id}-${idx}`,
    }))
  );

  if (isLoading) {
    return (
      <Card className="overflow-hidden flex-grow min-h-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flattenedItems.length === 0) {
    return (
      <Card className="overflow-hidden flex-grow min-h-0">
        <div className="h-full flex flex-1 items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">No sync runs found</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Frozen header row (fixed height) */}
        <div className="sticky top-0 z-10 bg-secondary border-b border-border backdrop-blur-sm">
          <div className="grid grid-cols-[150px_1fr_200px_120px] gap-4 px-4 py-3">
            <div className="text-xs font-semibold text-muted-foreground ml-6">Date</div>
            <div className="text-xs font-semibold text-muted-foreground">Category</div>
            <div className="text-xs font-semibold text-muted-foreground">Stats</div>
            <div className="text-xs font-semibold text-muted-foreground text-right">Overall Status</div>
          </div>
        </div>
        
        <ScrollArea className="h-full flex-1">
          <div className="divide-y divide-border">
            {flattenedItems.map((item) => (
              <LogRow
                key={item.uniqueKey}
                item={item}
                isExpanded={expandedRows.has(item.uniqueKey)}
                onToggleExpand={() => toggleExpanded(item.uniqueKey)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
