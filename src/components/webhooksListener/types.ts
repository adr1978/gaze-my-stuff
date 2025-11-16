export interface Webhook {
  id: string;
  timestamp: string; // Changed from Date to string to match API response
  method: 'POST' | 'PUT' | 'GET' | 'DELETE';
  endpoint: string;
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}
