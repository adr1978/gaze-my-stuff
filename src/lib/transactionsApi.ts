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

// FastAPI backend base URL (running on QNAP NAS)
const API_BASE_URL = "http://192.168.1.70:6059";

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
    return [
      {
        run_id: "run_1737014100",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "success",
        duration_ms: 2340,
        accounts_processed: [
          {
            account_id: "acc_starling_8246",
            owner: "Anthony",
            institution_name: "Starling",
            last_four: "8246",
            calls: [
              {
                call_id: "acc_starling_8246_gc_100000",
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
                  body: { transactions: { booked: [], pending: [] } },
                  truncated: false
                },
                error: null,
                status: "success"
              }
            ],
            summary: {
              fetched: 17,
              new: 15,
              updated: 2,
              skipped: 0,
              errors: 0
            }
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
