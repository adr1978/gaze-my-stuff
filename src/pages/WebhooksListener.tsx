import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WebhookList } from "@/components/webhooksListener/WebhookList";
import { WebhookDetail } from "@/components/webhooksListener/WebhookDetail";
import { webhookApi, type Webhook } from "@/lib/api";
import { toast } from "sonner";

export default function WebhooksListener() {
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | undefined>(undefined);

  // Fetch webhooks from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["webhooks", lastChecked],
    queryFn: () => webhookApi.getWebhooks(lastChecked),
    refetchInterval: autoRefresh ? 5000 : false, // 5 seconds when auto-refresh is on
  });

  // Convert timestamps from string to Date for display
  const webhooks: Webhook[] = (data?.webhooks || []).map(webhook => ({
    ...webhook,
    timestamp: webhook.timestamp as any, // Keep as string for filtering, component handles it
  }));

  // Update last checked timestamp when data changes
  useEffect(() => {
    if (data?.last_updated) {
      setLastChecked(data.last_updated);
    }
  }, [data]);

  // Handle toggle auto-refresh
  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.success(`Auto-refresh ${!autoRefresh ? 'enabled' : 'disabled'}`);
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    refetch();
    toast.success("Webhooks refreshed");
  };

  return (
    // 💡 FIX: Use h-screen (viewport height) and flex flex-col
    <div className="h-screen bg-background p-8 flex flex-col">
      
      {/* 2. Set to w-full, define as a vertical flex container, and allow it to grow. */}
      <div className="max-w-7xl mx-auto w-full space-y-6 flex flex-col flex-grow min-h-0">
        
        {/* Header content (fixed height) */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Webhooks Listener</h1>
            <p className="text-muted-foreground">
              Monitor and inspect incoming webhook requests in real-time
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={handleToggleAutoRefresh}
            >
              {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
            </Button>
          </div>
        </div>

        {/* 3. The Card: flex-grow and min-h-0 are correct. They'll now work
               because the parent container has a defined height (h-screen)
               and is a flex container. */}
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