import { useState } from "react";
import { Card } from "@/components/ui/card";
import { WebhookList } from "@/components/webhooksListener/WebhookList";
import { WebhookDetail } from "@/components/webhooksListener/WebhookDetail";
import type { Webhook } from "@/components/webhooksListener/types";

// Mock data for demonstration
const mockWebhooks: Webhook[] = [
  {
    id: "wh_1a2b3c4d5e",
    timestamp: new Date("2025-01-15T14:32:18Z"),
    method: "GET",
    endpoint: "/webhooks/users",
    statusCode: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "GitHub-Hookshot/abc123",
      "X-GitHub-Delivery": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      "X-GitHub-Event": "push",
      "X-Hub-Signature-256": "sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    },
    body: JSON.stringify({
      ref: "refs/heads/main",
      before: "abc123def456",
      after: "def456ghi789",
      repository: {
        id: 123456789,
        name: "example-repo",
        full_name: "user/example-repo",
      },
      pusher: {
        name: "user",
        email: "user@example.com",
      },
      commits: [
        {
          id: "def456ghi789",
          message: "Update README.md",
          timestamp: "2025-01-15T14:32:15Z",
          author: {
            name: "user",
            email: "user@example.com",
          },
        },
      ],
    }, null, 2),
  },
  {
    id: "wh_6f7g8h9i0j",
    timestamp: new Date("2025-01-15T13:15:42Z"),
    method: "POST",
    endpoint: "/webhooks/payments",
    statusCode: 201,
    statusText: "Created",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Stripe/1.0",
      "Stripe-Signature": "t=1642252542,v1=abc123def456,v0=ghi789jkl012",
    },
    body: JSON.stringify({
      id: "evt_1a2b3c4d5e",
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_1a2b3c4d5e",
          amount: 5000,
          currency: "usd",
          status: "succeeded",
        },
      },
    }, null, 2),
  },
  {
    id: "wh_2k3l4m5n6o",
    timestamp: new Date("2025-01-15T12:48:33Z"),
    method: "PUT",
    endpoint: "/webhooks/orders",
    statusCode: 500,
    statusText: "Internal Server Error",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Shopify/1.0",
      "X-Shopify-Topic": "orders/create",
      "X-Shopify-Hmac-SHA256": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz=",
    },
    body: JSON.stringify({
      id: 123456789,
      email: "customer@example.com",
      total_price: "150.00",
      line_items: [
        {
          id: 987654321,
          title: "Example Product",
          quantity: 2,
          price: "75.00",
        },
      ],
    }, null, 2),
  },
  {
    id: "wh_2k3l4m5n6o9",
    timestamp: new Date("2025-01-15T12:48:33Z"),
    method: "DELETE",
    endpoint: "/webhooks/orders",
    statusCode: 500,
    statusText: "Internal Server Error",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Shopify/1.0",
      "X-Shopify-Topic": "orders/create",
      "X-Shopify-Hmac-SHA256": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz=",
    },
    body: JSON.stringify({
      id: 123456789,
      email: "customer@example.com",
      total_price: "150.00",
      line_items: [
        {
          id: 987654321,
          title: "Example Product",
          quantity: 2,
          price: "75.00",
        },
      ],
    }, null, 2),
  },
];

export default function WebhooksListener() {
  const [webhooks] = useState<Webhook[]>(mockWebhooks);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  return (
    // 1. Set h-screen and define as a vertical flex container to manage the page content.
    <div className="h-screen bg-background p-8 flex flex-col">
      
      {/* 2. Set to w-full, define as a vertical flex container, and allow it to grow. */}
      <div className="max-w-7xl mx-auto w-full space-y-6 flex flex-col flex-grow">
        
        {/* Header content (fixed height) */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Webhooks Listener</h1>
          <p className="text-muted-foreground">
            Monitor and inspect incoming webhook requests in real-time
          </p>
        </div>

        {/* 3. The Card: Replace fixed height with flex-grow to fill remaining vertical space. */}
        <Card className="overflow-hidden flex-grow">
          {/* The inner grid needs h-full to occupy the entire Card height. */}
          <div className="grid grid-cols-[400px_1fr] h-full">
            <WebhookList
              webhooks={webhooks}
              selectedWebhookId={selectedWebhook?.id}
              onSelectWebhook={setSelectedWebhook}
            />
            <WebhookDetail webhook={selectedWebhook} />
          </div>
        </Card>
      </div>
    </div>
  );
}