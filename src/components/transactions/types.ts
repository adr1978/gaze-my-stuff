/**
 * TypeScript type definitions for Transaction Sync System
 * 
 * These interfaces match the API response structures from the FastAPI backend.
 * Used throughout the frontend components for type safety.
 */

/**
 * Error response body structure
 */
export interface ErrorBody {
  error?: string;
  message?: string;
  code?: string;
}

/**
 * Account summary statistics
 */
export interface AccountSummary {
  fetched: number;
  new: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Individual API call (GoCardless fetch or Notion create/update)
 */
export interface ApiCall {
  call_id: string;
  timestamp: string;
  call_type: "gocardless_fetch" | "notion_create" | "notion_update";
  transaction_id?: string;
  http_method: string;
  url: string;
  http_status: number;
  duration_ms: number;
  request: {
    headers: Record<string, string>;
    params?: Record<string, any>;
    body?: Record<string, any>;
  };
  response: {
    body: any;
    truncated?: boolean;
  };
  error: ErrorBody | null;
  status: "success" | "error";
}

/**
 * Account processing details for a sync run
 * Contains all API calls made for this account
 */
export interface AccountSync {
  account_id: string;
  owner: string;
  institution_name: string;
  last_four: string;
  calls: ApiCall[];
  summary: AccountSummary;
}

/**
 * Complete sync run log entry
 * Represents one execution of the transaction sync
 */
export interface SyncRun {
  run_id: string;
  timestamp: string;
  status: "success" | "warning" | "error";
  duration_ms: number;
  accounts_processed: AccountSync[];
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

// LogDetails interface removed - details are now embedded in ApiCall entries within AccountSync

/**
 * Filter state for log table
 * Controls which logs are displayed
 */
export interface LogFilters {
  date: string;
  accountId: string;
  searchQuery: string;
  status: "all" | "success" | "warning" | "error";
}

