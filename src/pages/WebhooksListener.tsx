import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WebhookList } from "@/components/webhooksListener/WebhookList";
import { WebhookDetail } from "@/components/webhooksListener/WebhookDetail";
import { webhookApi, type Webhook } from "@/lib/api";

export default function WebhooksListener() {
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [lastChecked, setLastChecked] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: ["webhooks", lastChecked],
    queryFn: () => webhookApi.getWebhooks(lastChecked),
    refetchInterval: autoRefresh ? 3000 : false,
  });

  // Convert timestamps from string to Date for display
  const webhooks: Webhook[] = (data?.webhooks || []).map(webhook => ({
    ...webhook,
    timestamp: webhook.timestamp as any, // Keep as string for filtering, component handles it
  }));

  useEffect(() => {
    if (data?.last_updated) {
      setLastChecked(data.last_updated);
    }
  }, [data]);

  useEffect(() => {
    if (!autoRefresh) {
      setCountdown(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 3 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    setCountdown(3);
  };

  return (
    <div className="h-screen bg-background p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex flex-col flex-grow min-h-0">
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Webhooks Listener</h1>
            <p className="text-muted-foreground">
              Monitor and inspect incoming webhook requests in real-time
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-md border border-border bg-background">
            <Label
              htmlFor="auto-refresh-webhooks"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Auto refresh {autoRefresh ? `(${countdown}s)` : ''}
            </Label>
            <Switch
              id="auto-refresh-webhooks"
              checked={autoRefresh}
              onCheckedChange={handleToggleAutoRefresh}
            />
          </div>
        </div>
        <Card className="overflow-hidden flex-grow min-h-0">
          {isLoading && webhooks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading webhooks...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">Failed to load webhooks. Please check your API connection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[400px_1fr] h-full">
              <WebhookList
                webhooks={webhooks}
                selectedWebhookId={selectedWebhook?.id}
                onSelectWebhook={setSelectedWebhook}
              />
              <WebhookDetail webhook={selectedWebhook} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}