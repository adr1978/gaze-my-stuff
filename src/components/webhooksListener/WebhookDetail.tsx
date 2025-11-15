import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { atelierCaveLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import type { Webhook } from "./types";

interface WebhookDetailProps {
  webhook: Webhook | null;
}

export function WebhookDetail({ webhook }: WebhookDetailProps) {
  if (!webhook) {
    return (
      <Card className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Select a webhook to see its details</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Request Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Request Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">ID:</span>
                <span className="font-mono">{webhook.id}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Timestamp:</span>
                <span className="font-mono">{webhook.timestamp.toISOString()}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Method:</span>
                <span className="font-mono font-semibold">{webhook.method}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Endpoint:</span>
                <span className="font-mono">{webhook.endpoint}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="font-mono">
                  {webhook.statusCode} {webhook.statusText}
                </span>
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
                  <span className="font-mono break-all">{value}</span>
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
              style={atelierCaveLight}
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
    </Card>
  );
}
