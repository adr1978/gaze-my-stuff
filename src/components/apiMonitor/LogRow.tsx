import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChildCallRow } from "./ChildCallRow";
import { CallDetailsModal } from "./CallDetailsModal";
import type { ItemSync, ApiCall } from "./types";

interface ItemWithTimestamp extends ItemSync {
  timestamp: string;
  uniqueKey: string;
  category: string;
}

interface LogRowProps {
  item: ItemWithTimestamp;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LogRow({ item, isExpanded, onToggleExpand }: LogRowProps) {
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleCallClick = (call: ApiCall) => {
    setSelectedCall(call);
    setShowDetailsModal(true);
  };

  // Determine overall status based on errors
  const hasErrors = item.summary.errors > 0;
  const hasWarnings = item.summary.skipped > 0;
  const status = hasErrors ? "ERROR" : hasWarnings ? "WARNING" : "SUCCESS";

  // Category display
  const categoryDisplay = {
    freeagent: "FreeAgent",
    lego: "Lego",
    plex_movies: "Plex (Movies)",
    plex_music: "Plex (Music)",
    whisk: "Whisk",
    uncategorised: "Uncategorised"
  }[item.category] || item.category;

  // Format timestamp
  const date = new Date(item.timestamp);
  const formattedDate = format(date, "dd-MMM-yyyy");

  return (
    <>
      <div className="hover:bg-muted/50 transition-colors">
        <div 
          className="grid grid-cols-[150px_1fr_200px_120px] gap-4 px-4 py-4 cursor-pointer items-center" 
          onClick={onToggleExpand}
        >
          {/* Date column */}
          <div className="flex items-center gap-2">
            <ChevronRight className={`h-4 w-4 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
            <p className="text-sm font-semibold text-foreground">
              {formattedDate}
            </p>
          </div>
          
          {/* Category column */}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {categoryDisplay}
            </p>
          </div>

          {/* Stats column */}
          <div className="text-xs text-muted-foreground">
            {item.summary.fetched} fetched • {item.summary.created} new • {item.summary.updated} updated
          </div>
          
          {/* Status column */}
          <div className="flex justify-end">
            {hasErrors && (
              <Badge 
                variant="outline"
                className="rounded-full bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20"
              >
                {item.summary.errors} {item.summary.errors === 1 ? 'ERROR' : 'ERRORS'}
              </Badge>
            )}
            {!hasErrors && (
              <Badge 
                variant="outline"
                className={status === "SUCCESS" 
                  ? "rounded-full bg-success/10 text-success border-transparent hover:bg-success/20"
                  : "rounded-full bg-warning/10 text-warning border-transparent hover:bg-warning/20"
                }
              >
                {status}
              </Badge>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-border bg-muted/30">
            {item.calls.map((call, idx) => (
              <ChildCallRow
                key={idx}
                call={call}
                onViewDetails={() => handleCallClick(call)}
              />
            ))}
          </div>
        )}
      </div>

      <CallDetailsModal
        call={selectedCall}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </>
  );
}
