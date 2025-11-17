import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
            <p className="text-lg font-medium">No sync runs found</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden flex-grow min-h-0 flex flex-col">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[180px]">Date/Time</TableHead>
              <TableHead className="w-[150px]">Item Name</TableHead>
              <TableHead className="w-[140px]">Category</TableHead>
              <TableHead className="w-[120px]">Source</TableHead>
              <TableHead className="w-[100px] text-center">Fetched</TableHead>
              <TableHead className="w-[100px] text-center">Created</TableHead>
              <TableHead className="w-[100px] text-center">Updated</TableHead>
              <TableHead className="w-[100px] text-center">Skipped</TableHead>
              <TableHead className="w-[100px] text-center">Errors</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedItems.map((item) => (
              <LogRow
                key={item.uniqueKey}
                item={item}
                isExpanded={expandedRows.has(item.uniqueKey)}
                onToggleExpand={() => toggleExpanded(item.uniqueKey)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
