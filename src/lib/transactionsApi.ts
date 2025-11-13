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
} from "@/components/transactionsMonitor/types";

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
 * @param endpoint - API endpoint path (e.g., "/api/transactionsMonitor/stats")
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
    return await apiRequest<SyncStats>("/api/transactionsMonitor/stats");
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
  try {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    params.append("limit", limit.toString());
    const endpoint = `/api/transactionsMonitor/logs?${params.toString()}`;
    return await apiRequest<SyncRun[]>(endpoint);
  } catch (error) {
    console.warn("Using fallback data for logs:", error);
    
    // Fallback dataset with multiple dates and proper date filtering
    const toIsoDate = (d: Date) => d.toISOString().split('T')[0];
    const targetDateStr = date || toIsoDate(new Date());

    const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

    const generateRunsForDate = (day: Date, includeFiveNotions = false): SyncRun[] => {
      const base = new Date(day);
      base.setHours(8, 15, 0, 0);
      const t1 = new Date(base);
      const t2 = new Date(base); t2.setHours(t2.getHours() - 6);
      const t3 = new Date(base); t3.setHours(t3.getHours() - 12);

      const notionCalls = (count: number, start: Date) =>
        Array.from({ length: count }).map((_, i) => ({
          call_id: makeId(`notion_${toIsoDate(day)}_${i + 1}`),
          timestamp: new Date(start.getTime() + (i + 1) * 700).toISOString(),
          call_type: "notion_create" as const,
          http_method: "POST",
          url: "https://api.notion.com/v1/pages",
          http_status: 200,
          duration_ms: 320 + i * 30,
          request: { headers: { Authorization: "Bearer ***" }, body: { parent: { database_id: "xxx" } } },
          response: { body: { id: makeId("page") } },
          error: null,
          status: "success" as const,
        }));

      const fetchCall = (at: Date, accId: string) => ({
        call_id: makeId(`gc_${accId}`),
        timestamp: at.toISOString(),
        call_type: "gocardless_fetch" as const,
        http_method: "GET",
        url: `https://bankaccountdata.gocardless.com/api/v2/accounts/${accId}/transactions/`,
        http_status: 200,
        duration_ms: 1100,
        request: { headers: { Authorization: "Bearer ***" }, params: { date_from: toIsoDate(day), date_to: toIsoDate(day) } },
        response: { body: { transactions: { booked: [], pending: [] } } },
        error: null,
        status: "success" as const,
      });

      const runSuccess: SyncRun = {
        run_id: makeId(`run_${toIsoDate(day)}_a`),
        timestamp: t1.toISOString(),
        status: "success",
        duration_ms: 4200,
        accounts_processed: [
          {
            account_id: "acc_starling_8246",
            owner: "Anthony",
            institution_name: "Starling Bank",
            last_four: "8246",
            calls: [
              fetchCall(t1, "acc_starling_8246"),
              ...notionCalls(includeFiveNotions ? 5 : 2, t1),
            ],
            summary: { fetched: includeFiveNotions ? 5 : 2, new: includeFiveNotions ? 5 : 2, updated: 0, skipped: 0, errors: 0 },
          },
          {
            account_id: "acc_monzo_4521",
            owner: "Jane",
            institution_name: "Monzo",
            last_four: "4521",
            calls: [fetchCall(new Date(t1.getTime() + 1000), "acc_monzo_4521"), ...notionCalls(1, t1)],
            summary: { fetched: 1, new: 1, updated: 0, skipped: 0, errors: 0 },
          },
        ],
      };

      const runWarning: SyncRun = {
        run_id: makeId(`run_${toIsoDate(day)}_b`),
        timestamp: t2.toISOString(),
        status: "warning",
        duration_ms: 2300,
        accounts_processed: [
          {
            account_id: "acc_starling_8246",
            owner: "Anthony",
            institution_name: "Starling Bank",
            last_four: "8246",
            calls: [
              fetchCall(t2, "acc_starling_8246"),
              {
                call_id: makeId("notion_rate_limit"),
                timestamp: new Date(t2.getTime() + 1500).toISOString(),
                call_type: "notion_create",
                http_method: "POST",
                url: "https://api.notion.com/v1/pages",
                http_status: 500,
                duration_ms: 1200,
                request: { headers: { Authorization: "Bearer ***" }, body: { parent: { database_id: "xxx" } } },
                response: { body: { error: "Internal Server Error", message: "Notion API rate limit exceeded" } },
                error: { error: "Internal Server Error", message: "Notion API rate limit exceeded" },
                status: "error",
              },
            ],
            summary: { fetched: 1, new: 0, updated: 0, skipped: 0, errors: 1 },
          },
        ],
      };

      const runError: SyncRun = {
        run_id: makeId(`run_${toIsoDate(day)}_c`),
        timestamp: t3.toISOString(),
        status: "error",
        duration_ms: 1500,
        accounts_processed: [
          {
            account_id: "acc_monzo_4521",
            owner: "Jane",
            institution_name: "Monzo",
            last_four: "4521",
            calls: [
              {
                call_id: makeId("gc_token_expired"),
                timestamp: t3.toISOString(),
                call_type: "gocardless_fetch",
                http_method: "GET",
                url: "https://bankaccountdata.gocardless.com/api/v2/accounts/acc_monzo_4521/transactions/",
                http_status: 401,
                duration_ms: 1450,
                request: { headers: { Authorization: "Bearer ***" }, params: { date_from: toIsoDate(day), date_to: toIsoDate(day) } },
                response: { body: { error: "Unauthorized", message: "Access token expired. Please reconfirm connection." } },
                error: { error: "Unauthorized", message: "Access token expired. Please reconfirm connection." },
                status: "error",
              },
            ],
            summary: { fetched: 0, new: 0, updated: 0, skipped: 0, errors: 1 },
          },
        ],
      };

      return [runSuccess, runWarning, runError];
    };

    // Generate runs for today and 4 previous days
    const today = new Date();
    const allRuns: SyncRun[] = [];
    
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      allRuns.push(...generateRunsForDate(d, i === 0));
    }

    return allRuns.slice(0, limit);
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
  return apiRequest<SyncConfig>("/api/transactionsMonitor/config");
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
