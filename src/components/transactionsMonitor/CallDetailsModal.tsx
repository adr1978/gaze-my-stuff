/**
 * CallDetailsModal Component
 * 
 * Displays detailed request/response data for a single API call.
 * Shows full HTTP details, headers, body, and error information.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { atelierCaveLight, atelierCaveDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Clock, Cloud, AlertTriangle, Globe } from "lucide-react";
import type { ApiCall } from "./types";
import { useTheme } from "next-themes";

interface CallDetailsModalProps {
  call: ApiCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDetailsModal({ call, open, onOpenChange }: CallDetailsModalProps) {
  const { resolvedTheme } = useTheme();
  if (!call) return null;

  const isError = call.status === "error";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            API Call Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-4">
            {/* Call Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Overview</h3>
                <Badge variant={isError ? "destructive" : "success"} className="pointer-events-none hover:bg-transparent">
                  {call.http_status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">
                    <span className={call.http_method === "GET" ? "text-success font-semibold" : "text-warning font-semibold"}>
                      {call.http_method}
                    </span>
                    {" "}
                    <span className="text-muted-foreground">{call.url}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{call.duration_ms}ms</span>
                </div>
                {call.transaction_id && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cloud className="h-4 w-4" />
                    <span>Transaction: {call.transaction_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message (if present) */}
            {call.error && (
              <div className="space-y-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Error</h3>
                </div>
                <div>
                  <p className="text-sm font-medium">{call.error.message}</p>
                  {call.error.code && (
                    <p className="text-xs text-muted-foreground mt-1">Code: {call.error.code}</p>
                  )}
                </div>
              </div>
            )}

            {/* Request Headers */}
            <div>
              <p className="text-sm font-medium mb-2">Request Headers</p>
              <SyntaxHighlighter
                language="json"
                style={resolvedTheme === "dark" ? atelierCaveDark : atelierCaveLight}
                customStyle={{
                  borderRadius: "6px",
                  fontSize: "12px",
                  maxHeight: "150px",
                }}
              >
                {JSON.stringify(call.request.headers, null, 2)}
              </SyntaxHighlighter>
            </div>

            {/* Request Parameters (if present) */}
            {call.request.params && Object.keys(call.request.params).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Request Parameters</p>
                <SyntaxHighlighter
                  language="json"
                  style={resolvedTheme === "dark" ? atelierCaveDark : atelierCaveLight}
                  customStyle={{
                    borderRadius: "6px",
                    fontSize: "12px",
                    maxHeight: "150px",
                  }}
                >
                  {JSON.stringify(call.request.params, null, 2)}
                </SyntaxHighlighter>
              </div>
            )}

            {/* Request Body (if present) */}
            {call.request.body && Object.keys(call.request.body).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Request Body</p>
                <SyntaxHighlighter
                  language="json"
                  style={resolvedTheme === "dark" ? atelierCaveDark : atelierCaveLight}
                  customStyle={{
                    borderRadius: "6px",
                    fontSize: "12px",
                    maxHeight: "300px",
                  }}
                >
                  {JSON.stringify(call.request.body, null, 2)}
                </SyntaxHighlighter>
              </div>
            )}

            {/* Response Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Response Body</p>
                {call.response.truncated && (
                  <Badge variant="secondary" className="text-xs pointer-events-none">
                    Truncated (first 10 transactions)
                  </Badge>
                )}
              </div>
              <SyntaxHighlighter
                language="json"
                style={resolvedTheme === "dark" ? atelierCaveDark : atelierCaveLight}
                customStyle={{
                  borderRadius: "6px",
                  fontSize: "12px",
                  maxHeight: "400px",
                }}
              >
                {JSON.stringify(call.response.body, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
