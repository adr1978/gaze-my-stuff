/**
 * DatePickerPopover Component
 * 
 * A custom date picker component that uses a popover-based calendar interface.
 * Provides a button trigger that opens a calendar in a popover for date selection.
 * 
 * Props:
 * - date: Currently selected date (Date object or undefined)
 * - onDateChange: Callback function triggered when a date is selected
 * - label: Label text displayed above the button
 * 
 * Dependencies:
 * - Uses Shadcn UI Popover and Calendar components
 * - Uses date-fns for date formatting
 */

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface DatePickerPopoverProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  label: string;
}

export function DatePickerPopover({ date, onDateChange, label }: DatePickerPopoverProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal rounded-md bg-muted text-foreground hover:bg-muted hover:text-foreground",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MMMM do, yyyy") : <span>Select date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
