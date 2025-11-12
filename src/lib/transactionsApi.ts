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
  LogDetails,
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
  return apiRequest<SyncStats>("/api/transactions/stats");
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
  return apiRequest<SyncRun[]>(endpoint);
}

/**
 * Fetch detailed request/response data for a specific run
 * 
 * Used for the log details modal to show full API debugging information.
 * Includes complete request/response bodies for both GoCardless and Notion.
 * 
 * @param runId - Unique run identifier (e.g., "run_1737014100")
 * @returns Promise<LogDetails> Detailed log information
 */
export async function fetchLogDetails(runId: string): Promise<LogDetails> {
  return apiRequest<LogDetails>(`/api/transactions/logs/${runId}`);
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
