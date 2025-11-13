import { useState } from "react";
import { ChevronRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChildCallRow } from "./ChildCallRow";
import { CallDetailsModal } from "./CallDetailsModal";
import type { SyncRun, ApiCall } from "./types";

interface LogRowProps {
  run: SyncRun;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LogRow({ run, isExpanded, onToggleExpand }: LogRowProps) {
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const statusIcon = run.status === "success" ? CheckCircle2 : run.status === "warning" ? AlertCircle : XCircle;
  const StatusIcon = statusIcon;

  const handleCallClick = (call: ApiCall) => {
    setSelectedCall(call);
    setShowDetailsModal(true);
  };

  return (
    <>
      <div className="hover:bg-muted/50 transition-colors">
        <div className="p-4 flex items-center justify-between gap-4 cursor-pointer" onClick={onToggleExpand}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            <StatusIcon className={`h-5 w-5 flex-shrink-0 ${run.status === "success" ? "text-emerald-600" : run.status === "warning" ? "text-amber-600" : "text-rose-600"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{format(new Date(run.timestamp), "HH:mm:ss")}</p>
              <p className="text-xs text-muted-foreground">{run.accounts_processed.length} accounts processed</p>
            </div>
            <Badge 
              variant={run.status === "success" ? "default" : run.status === "warning" ? "secondary" : "destructive"}
              className="border-2"
            >
              {run.status}
            </Badge>
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-border bg-muted/30">
            {run.accounts_processed.map((account) => (
              <div key={account.account_id} className="border-b border-border last:border-b-0">
                {/* Parent Account Row */}
                <div className="px-6 py-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {account.owner} - {account.institution_name} ({account.last_four})
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {account.summary.fetched} fetched • {account.summary.new} new • {account.summary.updated} updated
                        {account.summary.skipped > 0 && ` • ${account.summary.skipped} skipped`}
                        {account.summary.errors > 0 && (
                          <span className="text-destructive font-medium"> • {account.summary.errors} errors</span>
                        )}
                      </p>
                    </div>
                    {account.summary.errors > 0 && (
                      <Badge variant="destructive" className="ml-4">
                        {account.summary.errors} {account.summary.errors === 1 ? 'error' : 'errors'}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Child Call Rows */}
                <div>
                  {account.calls.map((call) => (
                    <ChildCallRow
                      key={call.call_id}
                      call={call}
                      onViewDetails={() => handleCallClick(call)}
                    />
                  ))}
                </div>
              </div>
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
