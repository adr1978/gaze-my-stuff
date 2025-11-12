/**
 * LogDetailsModal Component
 * 
 * Displays detailed request/response data for debugging a specific sync run.
 * Shows full API payloads for both GoCardless fetch and Notion upload operations.
 * 
 * Features:
 * - Syntax-highlighted JSON display
 * - Request/response headers and bodies
 * - HTTP status codes and timing information
 * - Expandable sections for each account processed
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { fetchLogDetails } from "@/lib/transactionsApi";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Clock, Database, ExternalLink } from "lucide-react";

interface LogDetailsModalProps {
  runId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogDetailsModal({ runId, open, onOpenChange }: LogDetailsModalProps) {
  // Fetch detailed log data for this run
  const { data: details, isLoading } = useQuery({
    queryKey: ["logDetails", runId],
    queryFn: () => fetchLogDetails(runId),
    enabled: open, // Only fetch when modal is open
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Log Details: {runId}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : details ? (
          <Tabs defaultValue="0" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${details.accounts.length}, 1fr)` }}>
              {details.accounts.map((account, idx) => (
                <TabsTrigger key={account.account_id} value={idx.toString()}>
                  {account.account_name}
                </TabsTrigger>
              ))}
            </TabsList>

            {details.accounts.map((account, idx) => (
              <TabsContent key={account.account_id} value={idx.toString()} className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(90vh-200px)]">
                  <div className="space-y-6 pr-4">
                    {/* GoCardless Fetch Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">GoCardless Fetch</h3>
                        <Badge variant={account.fetch_response.status === 200 ? "default" : "destructive"}>
                          {account.fetch_response.status}
                        </Badge>
                      </div>

                      {/* Request Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ExternalLink className="h-4 w-4" />
                          <span className="font-mono">{account.fetch_request.method} {account.fetch_request.url}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{account.fetch_response.duration_ms}ms</span>
                        </div>
                      </div>

                      {/* Request Headers */}
                      <div>
                        <p className="text-sm font-medium mb-2">Request Headers</p>
                        <SyntaxHighlighter
                          language="json"
                          style={vscDarkPlus}
                          customStyle={{
                            borderRadius: "6px",
                            fontSize: "12px",
                            maxHeight: "150px",
                          }}
                        >
                          {JSON.stringify(account.fetch_request.headers, null, 2)}
                        </SyntaxHighlighter>
                      </div>

                      {/* Response Body */}
                      <div>
                        <p className="text-sm font-medium mb-2">Response Body</p>
                        <SyntaxHighlighter
                          language="json"
                          style={vscDarkPlus}
                          customStyle={{
                            borderRadius: "6px",
                            fontSize: "12px",
                            maxHeight: "300px",
                          }}
                        >
                          {JSON.stringify(account.fetch_response.body, null, 2)}
                        </SyntaxHighlighter>
                      </div>
                    </div>

                    {/* Notion Upload Section (if applicable) */}
                    {account.notion_request && account.notion_response && (
                      <div className="space-y-3 pt-6 border-t">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Notion Upload</h3>
                          <Badge variant={account.notion_response.status === 200 ? "default" : "destructive"}>
                            {account.notion_response.status}
                          </Badge>
                        </div>

                        {/* Request Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ExternalLink className="h-4 w-4" />
                            <span className="font-mono">{account.notion_request.method} {account.notion_request.url}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{account.notion_response.duration_ms}ms</span>
                          </div>
                        </div>

                        {/* Request Body */}
                        <div>
                          <p className="text-sm font-medium mb-2">Request Body</p>
                          <SyntaxHighlighter
                            language="json"
                            style={vscDarkPlus}
                            customStyle={{
                              borderRadius: "6px",
                              fontSize: "12px",
                              maxHeight: "300px",
                            }}
                          >
                            {JSON.stringify(account.notion_request.body, null, 2)}
                          </SyntaxHighlighter>
                        </div>

                        {/* Response Body */}
                        <div>
                          <p className="text-sm font-medium mb-2">Response Body</p>
                          <SyntaxHighlighter
                            language="json"
                            style={vscDarkPlus}
                            customStyle={{
                              borderRadius: "6px",
                              fontSize: "12px",
                              maxHeight: "300px",
                            }}
                          >
                            {JSON.stringify(account.notion_response.body, null, 2)}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <p className="text-center text-muted-foreground py-12">No details available</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
