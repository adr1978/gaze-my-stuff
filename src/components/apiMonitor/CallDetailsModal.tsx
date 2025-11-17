import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ApiCall } from "./types";

interface CallDetailsModalProps {
  call: ApiCall;
  isOpen: boolean;
  onClose: () => void;
}

export function CallDetailsModal({ call, isOpen, onClose }: CallDetailsModalProps) {
  const isSuccess = call.status === "success";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            API Call Details
            <Badge variant={isSuccess ? "default" : "destructive"}>
              {call.response.status_code}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            {call.error && <TabsTrigger value="error">Error</TabsTrigger>}
          </TabsList>

          <TabsContent value="request" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Method & URL</h3>
              <div className="bg-muted p-3 rounded-md">
                <span className="font-mono text-sm">
                  {call.request.method} {call.request.url}
                </span>
              </div>
            </div>

            {call.request.headers && (
              <div>
                <h3 className="font-semibold mb-2">Headers</h3>
                <ScrollArea className="h-[150px] bg-muted p-3 rounded-md">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(call.request.headers, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}

            {call.request.body && (
              <div>
                <h3 className="font-semibold mb-2">Body</h3>
                <ScrollArea className="h-[150px] bg-muted p-3 rounded-md">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(call.request.body, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Status Code</h3>
              <div className="bg-muted p-3 rounded-md">
                <span className={`font-mono text-sm ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {call.response.status_code}
                </span>
              </div>
            </div>

            {call.response.body && (
              <div>
                <h3 className="font-semibold mb-2">Body</h3>
                <ScrollArea className="h-[300px] bg-muted p-3 rounded-md">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(call.response.body, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Duration</h3>
              <div className="bg-muted p-3 rounded-md">
                <span className="font-mono text-sm">{call.duration_ms}ms</span>
              </div>
            </div>
          </TabsContent>

          {call.error && (
            <TabsContent value="error" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Error Message</h3>
                <div className="bg-destructive/10 border border-destructive p-3 rounded-md">
                  <p className="text-sm text-destructive">{call.error.message}</p>
                </div>
              </div>

              {call.error.code && (
                <div>
                  <h3 className="font-semibold mb-2">Error Code</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <span className="font-mono text-sm">{call.error.code}</span>
                  </div>
                </div>
              )}

              {call.error.details && (
                <div>
                  <h3 className="font-semibold mb-2">Error Details</h3>
                  <ScrollArea className="h-[200px] bg-muted p-3 rounded-md">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(call.error.details, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
