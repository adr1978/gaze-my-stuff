import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCallClick = (call: ApiCall) => {
    setSelectedCall(call);
    setIsModalOpen(true);
  };

  // Format timestamp
  const date = new Date(item.timestamp);
  const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  const formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  // Determine status
  const hasErrors = item.summary.errors > 0;
  const hasWarnings = item.summary.skipped > 0;
  const status = hasErrors ? "error" : hasWarnings ? "warning" : "success";

  // Category display
  const categoryDisplay = {
    freeagent: "FreeAgent",
    lego: "Lego",
    plex_movies: "Plex (Movies)",
    plex_music: "Plex (Music)",
    whisk: "Whisk",
    uncategorised: "Uncategorised"
  }[item.category] || item.category;

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggleExpand}>
        <TableCell>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{formattedDate}</span>
            <span className="text-sm text-muted-foreground">{formattedTime}</span>
          </div>
        </TableCell>
        <TableCell className="font-medium">{item.item_name}</TableCell>
        <TableCell>{categoryDisplay}</TableCell>
        <TableCell className="text-muted-foreground">{item.source}</TableCell>
        <TableCell className="text-center">{item.summary.fetched}</TableCell>
        <TableCell className="text-center">{item.summary.created}</TableCell>
        <TableCell className="text-center">{item.summary.updated}</TableCell>
        <TableCell className="text-center">{item.summary.skipped}</TableCell>
        <TableCell className="text-center">{item.summary.errors}</TableCell>
        <TableCell>
          {status === "error" && (
            <Badge variant="destructive">ERROR</Badge>
          )}
          {status === "warning" && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
              WARNING
            </Badge>
          )}
          {status === "success" && (
            <Badge variant="outline" className="border-green-500 text-green-600">
              SUCCESS
            </Badge>
          )}
        </TableCell>
      </TableRow>

      {isExpanded && item.calls.map((call, idx) => (
        <ChildCallRow
          key={idx}
          call={call}
          onViewDetails={() => handleCallClick(call)}
        />
      ))}

      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
