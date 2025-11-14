import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChildCallRow } from "./ChildCallRow";
import { CallDetailsModal } from "./CallDetailsModal";
import type { AccountSync, ApiCall } from "./types";

interface AccountWithTimestamp extends AccountSync {
  timestamp: string;
}

interface LogRowProps {
  account: AccountWithTimestamp;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LogRow({ account, isExpanded, onToggleExpand }: LogRowProps) {
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleCallClick = (call: ApiCall) => {
    setSelectedCall(call);
    setShowDetailsModal(true);
  };

  // Determine overall status based on errors
  const hasErrors = account.summary.errors > 0;
  const hasWarnings = account.summary.skipped > 0;
  const status = hasErrors ? "ERROR" : hasWarnings ? "WARNING" : "SUCCESS";

  return (
    <>
      <div className="hover:bg-muted/50 transition-colors">
        <div 
          className="grid grid-cols-[80px_1fr_200px_120px] gap-4 px-4 py-4 cursor-pointer items-center" 
          onClick={onToggleExpand}
        >
          {/* Date column */}
          <div className="flex items-center gap-2">
            <ChevronRight className={`h-4 w-4 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
            <p className="text-sm font-semibold text-foreground">
              {format(new Date(account.timestamp), "dd/MM")}
            </p>
          </div>
          
          {/* Owner column */}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">
              {account.owner}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {account.institution_name} ({account.last_four})
            </p>
          </div>
          
          {/* Stats column */}
          <div className="text-xs text-muted-foreground">
            {account.summary.fetched} fetched • {account.summary.new} new • {account.summary.updated} updated
            {account.summary.skipped > 0 && ` • ${account.summary.skipped} skipped`}
          </div>
          
          {/* Status column */}
          <div className="flex justify-end">
            {hasErrors && (
              <Badge 
                variant="outline"
                className="rounded-full bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20"
              >
                {account.summary.errors} {account.summary.errors === 1 ? 'ERROR' : 'ERRORS'}
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
            {account.calls.map((call) => (
              <ChildCallRow
                key={call.call_id}
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
