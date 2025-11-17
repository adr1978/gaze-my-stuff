import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { DatePickerPopover } from "@/components/investments/DatePickerPopover";
import type { LogFilters } from "./types";

interface LogFiltersProps {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
}

export function LogFilters({ filters, onFiltersChange }: LogFiltersProps) {
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      onFiltersChange({ ...filters, date: `${day}/${month}/${year}` });
    } else {
      onFiltersChange({ ...filters, date: '' });
    }
  };

  const handleReset = () => {
    onFiltersChange({
      date: '',
      category: "all",
      searchQuery: "",
      status: "all",
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search run ID, item name, or errors..."
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select value={filters.category} onValueChange={(value) => onFiltersChange({ ...filters, category: value as LogFilters["category"] })}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="freeagent">FreeAgent</SelectItem>
              <SelectItem value="lego">Lego</SelectItem>
              <SelectItem value="plex_movies">Plex (Movies)</SelectItem>
              <SelectItem value="plex_music">Plex (Music)</SelectItem>
              <SelectItem value="uncategorised">Uncategorised</SelectItem>
              <SelectItem value="whisk">Whisk</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <DatePickerPopover
            date={filters.date ? new Date(filters.date.split('/').reverse().join('-')) : undefined}
            onDateChange={handleDateChange}
            label="Filter by date"
          />

          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value as LogFilters["status"] })}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset */}
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
