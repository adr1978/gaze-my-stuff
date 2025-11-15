import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { atelierCaveLight, atelierCaveDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import type { Webhook } from "./types";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface WebhookDetailProps {
  webhook: Webhook | null;
}

const methodColors = {
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

export function WebhookDetail({ webhook }: WebhookDetailProps) {
  const { theme } = useTheme();
  
  if (!webhook) {
    return (
      <div className="h-full flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-secondary border-b border-border">
          <div className="text-xs font-semibold text-muted-foreground px-4 py-3">
            Webhook Information
          </div>
        </div>

        {/* Empty state */}
        <div className="h-full flex flex-1 items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Select a webhook to see its details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Outer container correctly set to h-full flex flex-col
    <div className="h-full flex flex-col min-h-0">
      
      {/* Frozen header row */}
      <div className="bg-secondary border-b border-border">
        <div className="text-xs font-semibold text-muted-foreground px-4 py-3">
          Webhook Information
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="h-full flex-1">
        <div className="p-6 space-y-6">
          {/* Request Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Request Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">ID:</span>
                <span>{webhook.id}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Timestamp:</span>
                <span>{webhook.timestamp.toISOString()}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Method:</span>
                <Badge
                    variant="webhook"
                    className={cn(
                      "justify-self-start font-mono text-xs font-semibold",
                      methodColors[webhook.method]
                    )}
                  >
                    {webhook.method}
                  </Badge>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Endpoint:</span>
                <span className="font-mono">{webhook.endpoint}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="font-mono">{webhook.statusCode} {webhook.statusText}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Request Headers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Request Headers</h3>
            <div className="space-y-2">
              {Object.entries(webhook.headers).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[200px_1fr] gap-4 text-sm">
                  <span className="text-muted-foreground font-medium truncate">{key}:</span>
                  <span className="break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Request Body */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Request Body</h3>
            <SyntaxHighlighter
              language="json"
              style={theme === "dark" ? atelierCaveDark : atelierCaveLight}
              customStyle={{
                borderRadius: "6px",
                fontSize: "12px",
                padding: "16px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {webhook.body}
            </SyntaxHighlighter>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}