import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Webhook } from "./types";
import { cn } from "@/lib/utils";

interface WebhookListProps {
  webhooks: Webhook[];
  selectedWebhookId: string | undefined;
  onSelectWebhook: (webhook: Webhook) => void;
}

const methodColors = {
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

export function WebhookList({ webhooks, selectedWebhookId, onSelectWebhook }: WebhookListProps) {
  if (webhooks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 border-r border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No webhooks received yet</p>
          <p className="text-sm">Webhook events will appear here when received</p>
        </div>
      </div>
    );
  }

  return (
    // 1. Add 'flex flex-col' to container to enable Flexbox for vertical layout.
    <div className="h-full flex flex-col border-r border-border">
      {/* 2. Use 'flex-1' to make the ScrollArea consume all available height. */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {webhooks.map((webhook) => (
            <button
              key={webhook.id}
              onClick={() => onSelectWebhook(webhook)}
              className={cn(
                "w-full text-left p-4 transition-all",
                "hover:bg-muted/50",
                selectedWebhookId === webhook.id
                  ? "bg-accent/10 border-accent-foreground/20"
                  : "bg-card border-border"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="webhook"
                    className={cn(
                      "font-mono text-xs font-semibold",
                      methodColors[webhook.method]
                    )}
                  >
                    {webhook.method}
                  </Badge>
                  <span className="font-mono text-xs text-foreground truncate">
                    {webhook.endpoint}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(webhook.timestamp, "dd-MMM-yyyy HH:mm:ss")}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}