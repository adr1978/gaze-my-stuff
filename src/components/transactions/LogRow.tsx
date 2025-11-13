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
  const status = hasErrors ? "error" : hasWarnings ? "warning" : "success";

  return (
    <>
      <div className="hover:bg-muted/50 transition-colors">
        <div className="p-4 flex items-center justify-between gap-4 cursor-pointer" onClick={onToggleExpand}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {account.owner} - {account.institution_name} ({account.last_four})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(account.timestamp), "HH:mm:ss")} • {account.summary.fetched} fetched • {account.summary.new} new • {account.summary.updated} updated
                {account.summary.skipped > 0 && ` • ${account.summary.skipped} skipped`}
              </p>
            </div>
            {hasErrors && (
              <Badge variant="destructive">
                {account.summary.errors} {account.summary.errors === 1 ? 'error' : 'errors'}
              </Badge>
            )}
            {!hasErrors && (
              <Badge variant={status === "success" ? "success" : "warning"}>
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
