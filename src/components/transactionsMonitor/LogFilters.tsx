import { Search, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerPopover } from "@/components/investments/DatePickerPopover";
import type { LogFilters } from "./types";

interface LogFiltersProps {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  onRefresh: () => void;
}

export function LogFilters({ filters, onFiltersChange, onRefresh }: LogFiltersProps) {
  // Convert date string to Date object for the picker
  const dateValue = filters.date ? new Date(filters.date) : new Date();

  const handleDateChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm font-medium">Search</label>
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
          <div className="w-[200px]">
            <DatePickerPopover
              date={dateValue}
              onDateChange={handleDateChange}
              label="Date"
            />
          </div>
          <div className="w-[180px] space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value as LogFilters['status'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onRefresh} variant="outline" size="icon" className="h-10">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
