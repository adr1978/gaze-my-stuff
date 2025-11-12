import { useState } from "react";
import { ChevronRight, CheckCircle2, AlertCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { NotionUploadRow } from "./NotionUploadRow";
import { LogDetailsModal } from "./LogDetailsModal";
import type { SyncRun } from "./types";

interface LogRowProps {
  run: SyncRun;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LogRow({ run, isExpanded, onToggleExpand }: LogRowProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const statusIcon = run.status === "success" ? CheckCircle2 : run.status === "warning" ? AlertCircle : XCircle;
  const StatusIcon = statusIcon;

  // Prevent modal trigger from expanding/collapsing the row
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetailsModal(true);
  };

  return (
    <>
      <div className="hover:bg-muted/50 transition-colors">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            <StatusIcon className={`h-5 w-5 flex-shrink-0 ${run.status === "success" ? "text-emerald-600" : run.status === "warning" ? "text-amber-600" : "text-rose-600"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{format(new Date(run.timestamp), "HH:mm:ss")}</p>
              <p className="text-xs text-muted-foreground">{run.accounts_processed.length} accounts</p>
            </div>
            <Badge variant={run.status === "success" ? "default" : run.status === "warning" ? "secondary" : "destructive"}>{run.status}</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDetailsClick}
            className="flex-shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        {isExpanded && (
          <div className="border-t border-border bg-muted/30">
            {run.accounts_processed.map((account) => (
              <NotionUploadRow key={account.account_id} account={account} />
            ))}
          </div>
        )}
      </div>

      <LogDetailsModal
        runId={run.run_id}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </>
  );
}
