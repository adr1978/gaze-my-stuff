import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eraser } from "lucide-react";
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
      <CardContent className="p-4">
        <div className="flex gap-3 items-end flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search run ID, item name, or errors..."
                value={filters.searchQuery}
                onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-[180px] space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={filters.category} onValueChange={(value) => onFiltersChange({ ...filters, category: value as LogFilters["category"] })}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
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
          </div>

          {/* Date Filter */}
          <div className="w-[200px]">
            <DatePickerPopover
              date={filters.date ? new Date(filters.date.split('/').reverse().join('-')) : undefined}
              onDateChange={handleDateChange}
              label="Date"
            />
          </div>

          {/* Status Filter */}
          <div className="w-[180px] space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value as LogFilters["status"] })}>
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

          {/* Reset */}
          <Button onClick={handleReset} variant="outline" className="h-10 bg-muted hover:bg-muted/80">
            <Eraser className="h-4 w-4 mr-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
