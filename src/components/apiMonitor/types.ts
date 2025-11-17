/**
 * TypeScript interfaces for API Monitor System
 * Mirrors the API response structures from FastAPI backend
 */

// Error details from API calls
export interface ErrorBody {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Single API interaction (fetch from source or create in Notion)
export interface ApiCall {
  timestamp: string;
  type: "fetch" | "notion_create" | "notion_update";
  status: "success" | "error";
  duration_ms: number;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: {
    status_code: number;
    body?: any;
  };
  error?: ErrorBody;
}

// Summary stats for a single item's processing
export interface ItemSummary {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

// Details for a specific item's sync run
export interface ItemSync {
  item_name: string;
  source: string;
  summary: ItemSummary;
  calls: ApiCall[];
}

// Complete API sync execution
export interface ApiRun {
  run_id: string;
  timestamp: string;
  category: string;
  status: "success" | "partial_success" | "failed";
  duration_ms: number;
  items_processed: ItemSync[];
}

// Dashboard overview statistics
export interface MonitorStats {
  requests_today: number;
  avg_duration_ms: number;
  success_rate: number;
  pages_created_today: number;
  next_scheduled_run?: string;
  recent_runs: {
    timestamp: string;
    status: "success" | "partial_success" | "failed";
    category: string;
  }[];
}

// Filtering criteria for log table
export interface LogFilters {
  date: string;
  category: "all" | "freeagent" | "lego" | "plex_movies" | "plex_music" | "uncategorised" | "whisk";
  searchQuery: string;
  status: "all" | "success" | "warning" | "error";
}
