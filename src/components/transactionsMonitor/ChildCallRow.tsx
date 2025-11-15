import { CheckCircle2, XCircle, Eye, Database, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { ApiCall } from "./types";

interface ChildCallRowProps {
  call: ApiCall;
  onViewDetails: () => void;
}

export function ChildCallRow({ call, onViewDetails }: ChildCallRowProps) {
  const isError = call.status === "error";
  const StatusIcon = isError ? XCircle : CheckCircle2;
  
  // Determine call type label
  let callTypeLabel = "";
  let CallIcon = Database;
  
  if (call.call_type === "gocardless_fetch") {
    callTypeLabel = "Fetch Transactions";
    CallIcon = Database;
  } else if (call.call_type === "notion_create") {
    callTypeLabel = "Create in Notion";
    CallIcon = FileUp;
  } else if (call.call_type === "notion_update") {
    callTypeLabel = "Update in Notion";
    CallIcon = FileUp;
  }

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-muted/30 transition-colors border-l-2 border-border ml-8">
      <div className="flex items-center gap-3 flex-1 min-w-0 grid grid-cols-[15px_15px_150px_1fr_20px]">
        <StatusIcon 
          className={`h-4 w-4 flex-shrink-0 ${
            isError ? "text-destructive" : "text-emerald-600"
          }`} 
        />
        <CallIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-sm font-medium truncate">{callTypeLabel}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(call.timestamp), "HH:mm:ss")} • {call.duration_ms}ms
            {call.transaction_id && ` • ${call.transaction_id.substring(0, 8)}...`}
          </p>
        </div>
        <div className="text-xs">
          <span className="font-mono">
            <span className={call.http_method === "GET" ? "text-success font-semibold" : "text-warning font-semibold"}>
              {call.http_method}
            </span>
            {" "}
            <span className="text-muted-foreground">{call.url}</span>
          </span>
        </div>
        <span className={`text-xs font-mono ${isError ? "text-destructive" : "text-muted-foreground"}`}>
          {call.http_status}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onViewDetails}
        className="flex-shrink-0"
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  );
}
