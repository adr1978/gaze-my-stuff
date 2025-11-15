export interface Webhook {
  id: string;
  timestamp: Date;
  method: 'POST' | 'PUT' | 'GET' | 'DELETE';
  endpoint: string;
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}
