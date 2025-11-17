import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Database, FileUp, RefreshCw } from "lucide-react";
import type { ApiCall } from "./types";

interface ChildCallRowProps {
  call: ApiCall;
  onViewDetails: () => void;
}

export function ChildCallRow({ call, onViewDetails }: ChildCallRowProps) {
  const isSuccess = call.status === "success";
  
  const callTypeConfig = {
    fetch: { icon: Database, label: "Fetch Data" },
    notion_create: { icon: FileUp, label: "Create in Notion" },
    notion_update: { icon: RefreshCw, label: "Update in Notion" },
  };
  
  const config = callTypeConfig[call.type];
  const Icon = config.icon;

  return (
    <TableRow className="bg-muted/30">
      <TableCell></TableCell>
      <TableCell colSpan={2}>
        <div className="flex items-center gap-3 pl-8">
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          )}
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm">{config.label}</span>
        </div>
      </TableCell>
      <TableCell colSpan={2}>
        <div className="text-sm text-muted-foreground">
          <span className="font-mono">{new Date(call.timestamp).toLocaleTimeString()}</span>
          <span className="mx-2">•</span>
          <span>{call.duration_ms}ms</span>
        </div>
      </TableCell>
      <TableCell colSpan={4}>
        <div className="text-sm text-muted-foreground truncate">
          <span className="font-semibold">{call.request.method}</span>
          {" "}
          <span className="font-mono text-xs">{call.request.url}</span>
        </div>
      </TableCell>
      <TableCell colSpan={2}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {call.response.status_code}
          </span>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
