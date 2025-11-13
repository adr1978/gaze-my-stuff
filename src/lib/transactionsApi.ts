/**
 * Transactions API Client
 * 
 * Provides functions to interact with the FastAPI backend for transaction sync monitoring.
 * Base URL: http://192.168.1.70:6059
 * 
 * All functions include error handling and return typed responses.
 */

import {
  SyncStats,
  SyncRun,
  SyncConfig,
} from "@/components/transactions/types";

/**
 * Detect the appropriate API base URL based on current environment
 * 
 * Priority:
 * 1. If accessed via hub.broomfield.family → use domain endpoint
 * 2. If accessed via local network → use internal IP
 * 3. Otherwise → return null (triggers fallback to dummy data)
 */
function getApiBaseUrl(): string | null {
  const hostname = window.location.hostname;
  
  // Check if we're on the Cloudflare tunnel domain
  if (hostname === "hub.broomfield.family") {
    return "https://hub.broomfield.family:6059";
  }
  
  // Check if we're on local network (lovable preview or localhost)
  // For local development and internal access
  if (hostname.includes("lovableproject.com") || 
      hostname === "localhost" || 
      hostname.startsWith("192.168.")) {
    return "http://192.168.1.70:6059";
  }
  
  // External access without proper domain → use fallback data
  return null;
}

// Get the API base URL (may be null)
const API_BASE_URL = getApiBaseUrl();

/**
 * Generic fetch wrapper with error handling
 * 
 * @param endpoint - API endpoint path (e.g., "/api/transactions/stats")
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws Error with descriptive message if request fails
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // If no API base URL (external access), throw immediately to use fallback
  if (!API_BASE_URL) {
    throw new Error("API not accessible from this network");
  }
  
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `API request failed with status ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch ${endpoint}: ${error.message}`);
    }
    throw new Error(`Failed to fetch ${endpoint}: Unknown error`);
  }
}

/**
 * Fetch summary statistics for dashboard overview
 * 
 * Includes:
 * - Today's transaction count and run statistics
 * - Next scheduled run time
 * - 7-day success rate
 * - Active account count
 * 
 * @returns Promise<SyncStats> Summary statistics object
 */
export async function fetchSyncStats(): Promise<SyncStats> {
  try {
    return await apiRequest<SyncStats>("/api/transactions/stats");
  } catch (error) {
    // Fallback dummy data when backend is unavailable
    console.warn("Using fallback data for stats:", error);
    return {
      today: {
        date: new Date().toISOString().split('T')[0],
        total_transactions: 87,
        successful_runs: 3,
        failed_runs: 0,
        last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        next_run: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
        duration_ms: 3240
      },
      active_accounts: 4,
      last_7_days_success_rate: 0.96
    };
  }
}

/**
 * Fetch paginated sync run logs for a specific date
 * 
 * Returns array of sync runs with account processing details.
 * Logs are ordered by timestamp (most recent first).
 * 
 * @param date - Target date in YYYY-MM-DD format (defaults to today)
 * @param limit - Maximum number of runs to return (default: 20)
 * @returns Promise<SyncRun[]> Array of sync run objects
 */
export async function fetchSyncLogs(
  date?: string,
  limit: number = 20
): Promise<SyncRun[]> {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  params.append("limit", limit.toString());

  const endpoint = `/api/transactions/logs?${params.toString()}`;
  
  try {
    return await apiRequest<SyncRun[]>(endpoint);
  } catch (error) {
    console.warn("Using fallback data for logs:", error);
    
    // Generate comprehensive dummy data with various scenarios
    const now = Date.now();
    return [
      // Run 1: Success with multiple accounts
      {
        run_id: "run_1737014100",
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        status: "success",
        duration_ms: 4580,
        accounts_processed: [
          {
            account_id: "acc_starling_8246",
            owner: "Anthony",
            institution_name: "Starling",
            last_four: "8246",
            calls: [
              {
                call_id: "acc_starling_8246_gc_1",
                timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                call_type: "gocardless_fetch",
                http_method: "GET",
                url: "https://bankaccountdata.gocardless.com/api/v2/accounts/acc_starling_8246/transactions/",
                http_status: 200,
                duration_ms: 1200,
                request: {
                  headers: { "Authorization": "Bearer ***", "Content-Type": "application/json" },
                  params: { "date_from": "2025-01-10", "date_to": "2025-01-16" }
                },
                response: {
                  body: { transactions: { booked: [{ id: "tx1" }, { id: "tx2" }], pending: [] } },
                  truncated: false
                },
                error: null,
                status: "success"
              },
              {
                call_id: "acc_starling_8246_notion_1",
                timestamp: new Date(now - 2 * 60 * 60 * 1000 + 1300).toISOString(),
                call_type: "notion_create",
                http_method: "POST",
                url: "https://api.notion.com/v1/pages",
                http_status: 200,
                duration_ms: 450,
                request: {
                  headers: { "Authorization": "Bearer ***", "Notion-Version": "2022-06-28" },
                  body: { parent: { database_id: "***" }, properties: {} }
                },
                response: {
                  body: { id: "page_abc123", created_time: "2025-01-16T22:55:43.000Z" },
                  truncated: false
                },
                error: null,
                status: "success"
              }
            ],
            summary: { fetched: 17, new: 15, updated: 2, skipped: 0, errors: 0 }
          },
          {
            account_id: "acc_monzo_1234",
            owner: "Anthony",
            institution_name: "Monzo",
            last_four: "1234",
            calls: [
              {
                call_id: "acc_monzo_1234_gc_1",
                timestamp: new Date(now - 2 * 60 * 60 * 1000 + 2000).toISOString(),
                call_type: "gocardless_fetch",
                http_method: "GET",
                url: "https://bankaccountdata.gocardless.com/api/v2/accounts/acc_monzo_1234/transactions/",
                http_status: 200,
                duration_ms: 980,
                request: {
                  headers: { "Authorization": "Bearer ***" },
                  params: { "date_from": "2025-01-10", "date_to": "2025-01-16" }
                },
                response: {
                  body: { transactions: { booked: [{ id: "tx3" }], pending: [{ id: "tx4" }] } },
                  truncated: false
                },
                error: null,
                status: "success"
              }
            ],
            summary: { fetched: 8, new: 7, updated: 1, skipped: 0, errors: 0 }
          }
        ]
      },
      
      // Run 2: Partial failure with rate limiting
      {
        run_id: "run_1737007800",
        timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
        status: "warning",
        duration_ms: 2150,
        accounts_processed: [
          {
            account_id: "acc_hsbc_5678",
            owner: "Josephine",
            institution_name: "HSBC",
            last_four: "5678",
            calls: [
              {
                call_id: "acc_hsbc_5678_gc_1",
                timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
                call_type: "gocardless_fetch",
                http_method: "GET",
                url: "https://bankaccountdata.gocardless.com/api/v2/accounts/acc_hsbc_5678/transactions/",
                http_status: 429,
                duration_ms: 850,
                request: {
                  headers: { "Authorization": "Bearer ***" },
                  params: { "date_from": "2025-01-10", "date_to": "2025-01-16" }
                },
                response: { body: {}, truncated: false },
                error: {
                  code: "RATE_LIMIT_EXCEEDED",
                  message: "Rate limit exceeded. Please try again in 60 seconds."
                },
                status: "error"
              }
            ],
            summary: { fetched: 0, new: 0, updated: 0, skipped: 0, errors: 1 }
          }
        ]
      },
      
      // Run 3: Complete failure with network error
      {
        run_id: "run_1737001200",
        timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        status: "error",
        duration_ms: 5200,
        accounts_processed: [
          {
            account_id: "acc_natwest_9999",
            owner: "Business",
            institution_name: "NatWest",
            last_four: "9999",
            calls: [
              {
                call_id: "acc_natwest_9999_gc_1",
                timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
                call_type: "gocardless_fetch",
                http_method: "GET",
                url: "https://bankaccountdata.gocardless.com/api/v2/accounts/acc_natwest_9999/transactions/",
                http_status: 0,
                duration_ms: 5000,
                request: {
                  headers: { "Authorization": "Bearer ***" },
                  params: { "date_from": "2025-01-10", "date_to": "2025-01-16" }
                },
                response: { body: {}, truncated: false },
                error: {
                  code: "NETWORK_ERROR",
                  message: "Failed to connect to GoCardless API after 3 retries"
                },
                status: "error"
              }
            ],
            summary: { fetched: 0, new: 0, updated: 0, skipped: 0, errors: 1 }
          }
        ]
      },
      
      // Run 4: Success with Notion upload failures
      {
        run_id: "run_1736994600",
        timestamp: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
        status: "warning",
        duration_ms: 3240,
        accounts_processed: [
          {
            account_id: "acc_barclays_4321",
            owner: "Children",
            institution_name: "Barclays",
            last_four: "4321",
            calls: [
              {
                call_id: "acc_barclays_4321_gc_1",
                timestamp: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
                call_type: "gocardless_fetch",
                http_method: "GET",
                url: "https://bankaccountdata.gocardless.com/api/v2/accounts/acc_barclays_4321/transactions/",
                http_status: 200,
                duration_ms: 1100,
                request: {
                  headers: { "Authorization": "Bearer ***" },
                  params: { "date_from": "2025-01-10", "date_to": "2025-01-16" }
                },
                response: {
                  body: { transactions: { booked: [{ id: "tx5" }, { id: "tx6" }, { id: "tx7" }], pending: [] } },
                  truncated: false
                },
                error: null,
                status: "success"
              },
              {
                call_id: "acc_barclays_4321_notion_1",
                timestamp: new Date(now - 8 * 60 * 60 * 1000 + 1200).toISOString(),
                call_type: "notion_create",
                http_method: "POST",
                url: "https://api.notion.com/v1/pages",
                http_status: 400,
                duration_ms: 320,
                request: {
                  headers: { "Authorization": "Bearer ***", "Notion-Version": "2022-06-28" },
                  body: { parent: { database_id: "***" }, properties: {} }
                },
                response: { body: {}, truncated: false },
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Invalid property: Amount must be a valid number"
                },
                status: "error"
              }
            ],
            summary: { fetched: 12, new: 10, updated: 0, skipped: 0, errors: 2 }
          }
        ]
      },
      
      // Run 5: Large success with many transactions
      {
        run_id: "run_1736988000",
        timestamp: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
        status: "success",
        duration_ms: 8640,
        accounts_processed: [
          {
            account_id: "acc_revolut_7777",
            owner: "Anthony",
            institution_name: "Revolut",
            last_four: "7777",
            calls: [
              {
                call_id: "acc_revolut_7777_gc_1",
                timestamp: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
                call_type: "gocardless_fetch",
                http_method: "GET",
                url: "https://bankaccountdata.gocardless.com/api/v2/accounts/acc_revolut_7777/transactions/",
                http_status: 200,
                duration_ms: 1450,
                request: {
                  headers: { "Authorization": "Bearer ***" },
                  params: { "date_from": "2025-01-10", "date_to": "2025-01-16" }
                },
                response: {
                  body: { transactions: { booked: [], pending: [] } },
                  truncated: true
                },
                error: null,
                status: "success"
              },
              {
                call_id: "acc_revolut_7777_notion_batch_1",
                timestamp: new Date(now - 10 * 60 * 60 * 1000 + 1500).toISOString(),
                call_type: "notion_create",
                http_method: "POST",
                url: "https://api.notion.com/v1/pages",
                http_status: 200,
                duration_ms: 2400,
                request: {
                  headers: { "Authorization": "Bearer ***", "Notion-Version": "2022-06-28" },
                  body: { parent: { database_id: "***" }, properties: {} }
                },
                response: {
                  body: { id: "page_xyz789", created_time: "2025-01-16T12:30:04.000Z" },
                  truncated: false
                },
                error: null,
                status: "success"
              }
            ],
            summary: { fetched: 43, new: 38, updated: 5, skipped: 0, errors: 0 }
          },
          {
            account_id: "acc_amex_3333",
            owner: "Anthony",
            institution_name: "American Express",
            last_four: "3333",
            calls: [
              {
                call_id: "acc_amex_3333_gc_1",
                timestamp: new Date(now - 10 * 60 * 60 * 1000 + 4000).toISOString(),
                call_type: "gocardless_fetch",
                http_method: "GET",
                url: "https://bankaccountdata.gocardless.com/api/v2/accounts/acc_amex_3333/transactions/",
                http_status: 200,
                duration_ms: 1320,
                request: {
                  headers: { "Authorization": "Bearer ***" },
                  params: { "date_from": "2025-01-10", "date_to": "2025-01-16" }
                },
                response: {
                  body: { transactions: { booked: [], pending: [] } },
                  truncated: false
                },
                error: null,
                status: "success"
              }
            ],
            summary: { fetched: 28, new: 22, updated: 6, skipped: 0, errors: 0 }
          }
        ]
      }
    ];
  }
}

/**
 * Fetch detailed request/response data for a specific API call
 * 
 * NOTE: This function is deprecated as call details are now embedded
 * in the ApiCall entries within each AccountSync
 * 
 * @param runId - Unique run identifier
 * @returns Promise<never> - This endpoint no longer exists
 */
export async function fetchLogDetails(runId: string): Promise<never> {
  throw new Error("fetchLogDetails is deprecated - call details are now embedded in sync logs");
}

/**
 * Fetch sync configuration
 * 
 * Returns:
 * - Cron schedule and human-readable description
 * - List of enabled account IDs
 * - Next scheduled run times
 * - Timezone configuration
 * 
 * @returns Promise<SyncConfig> Configuration object
 */
export async function fetchSyncConfig(): Promise<SyncConfig> {
  return apiRequest<SyncConfig>("/api/transactions/config");
}

/**
 * Health check endpoint
 * 
 * Verifies that the FastAPI backend is running and accessible.
 * Useful for displaying connection status in the UI.
 * 
 * @returns Promise<{ status: string; message: string }> Health status
 */
export async function checkApiHealth(): Promise<{
  status: string;
  message: string;
}> {
  return apiRequest<{ status: string; message: string }>("/health");
}
