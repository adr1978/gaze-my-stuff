import { Search, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { LogFilters } from "./types";

interface LogFiltersProps {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  onRefresh: () => void;
}

export function LogFilters({ filters, onFiltersChange, onRefresh }: LogFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by run ID or error..."
                value={filters.searchQuery}
                onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={onRefresh} variant="outline" size="icon">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
