/**
 * TypeScript type definitions for Transaction Sync System
 * 
 * These interfaces match the API response structures from the FastAPI backend.
 * Used throughout the frontend components for type safety.
 */

/**
 * Notion upload status for a single account
 * Child relationship to account fetch
 */
export interface NotionUpload {
  /** Overall status of Notion upload */
  status: "success" | "warning" | "error" | "skipped";
  /** Duration of upload operation in milliseconds */
  duration_ms: number;
  /** Number of transactions successfully uploaded */
  uploaded_count: number;
  /** HTTP status code from Notion API */
  http_status: number;
  /** Error response body (if status is error) */
  error_body: {
    error?: string;
    message?: string;
    code?: string;
  } | null;
}

/**
 * Account processing details for a sync run
 * Parent relationship with NotionUpload as child
 */
export interface AccountProcessed {
  /** GoCardless account UUID */
  account_id: string;
  /** Human-readable account name (e.g., "Starling - 8246") */
  account_name: string;
  /** Institution name (e.g., "Starling", "Monzo") */
  institution: string;
  /** Status of GoCardless fetch operation */
  fetch_status: "success" | "error";
  /** Duration of fetch operation in milliseconds */
  fetch_duration_ms: number;
  /** Number of pending transactions fetched */
  transactions_pending: number;
  /** Number of booked transactions fetched */
  transactions_booked: number;
  /** HTTP status code from GoCardless API */
  http_status: number;
  /** Error response body from GoCardless (if fetch failed) */
  error_body: {
    error?: string;
    message?: string;
    code?: string;
  } | null;
  /** Notion upload details (null if fetch failed) */
  notion_upload: NotionUpload | null;
}

/**
 * Complete sync run log entry
 * Represents one execution of the fetch_transactions.py script
 */
export interface SyncRun {
  /** Unique run identifier (e.g., "run_1737014100") */
  run_id: string;
  /** ISO timestamp when run started */
  timestamp: string;
  /** Overall run status (success if all accounts succeeded) */
  status: "success" | "warning" | "error";
  /** Total duration of entire run in milliseconds */
  duration_ms: number;
  /** Array of account processing results */
  accounts_processed: AccountProcessed[];
}

/**
 * Summary statistics for dashboard overview
 * Updated by each sync run
 */
export interface SyncStats {
  /** Today's statistics */
  today: {
    /** Current date (YYYY-MM-DD) */
    date: string;
    /** Total transactions fetched today */
    total_transactions: number;
    /** Number of successful runs today */
    successful_runs: number;
    /** Number of failed runs today */
    failed_runs: number;
    /** ISO timestamp of most recent run */
    last_run: string;
    /** ISO timestamp of next scheduled run */
    next_run: string;
    /** Duration of last run in milliseconds */
    duration_ms: number;
  };
  /** Number of active (sync_enabled=true) accounts */
  active_accounts: number;
  /** Success rate over last 7 days (0.0 to 1.0) */
  last_7_days_success_rate: number;
}

/**
 * Sync configuration
 * Defines cron schedule and enabled accounts
 */
export interface SyncConfig {
  /** Cron expression (e.g., every 6 hours) */
  cron_schedule: string;
  /** Human-readable schedule description */
  cron_description: string;
  /** Array of enabled account IDs */
  enabled_accounts: string[];
  /** Array of next scheduled run timestamps */
  next_run_times: string[];
  /** Timezone for schedule (e.g., Europe/London) */
  timezone: string;
  /** Number of days to retain logs */
  log_retention_days?: number;
}

/**
 * Detailed request/response data for log details modal
 * Provides full debugging information for a specific account
 */
export interface LogDetails {
  /** Run identifier */
  run_id: string;
  /** ISO timestamp */
  timestamp: string;
  /** Array of account details */
  accounts: Array<{
    account_id: string;
    account_name: string;
    /** GoCardless fetch request details */
    fetch_request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      params?: Record<string, string>;
    };
    /** GoCardless fetch response details */
    fetch_response: {
      status: number;
      duration_ms: number;
      body: any; // Raw JSON response
    };
    /** Notion upload request details (if applicable) */
    notion_request?: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: any;
    };
    /** Notion upload response details (if applicable) */
    notion_response?: {
      status: number;
      duration_ms: number;
      body: any;
    };
  }>;
}

/**
 * Filter state for log table
 * Controls which logs are displayed
 */
export interface LogFilters {
  /** Selected date (YYYY-MM-DD) or "today" */
  date: string;
  /** Selected account ID (empty string = all accounts) */
  accountId: string;
  /** Search query (filters by run_id, error messages) */
  searchQuery: string;
  /** Status filter */
  status: "all" | "success" | "warning" | "error";
}

