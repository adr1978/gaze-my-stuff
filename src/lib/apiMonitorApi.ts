import type { MonitorStats, ApiRun } from "@/components/apiMonitor/types";

/**
 * API Monitor Client
 * Handles fetching data from FastAPI backend with fallback to sample data
 */

function getApiBaseUrl(): string | null {
  const hostname = window.location.hostname;
  
  if (hostname === "localhost" || hostname.startsWith("192.168.")) {
    return "http://192.168.1.70:6059";
  }
  
  return null;
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  
  if (!baseUrl) {
    throw new Error("API not accessible from this environment");
  }
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchMonitorStats(): Promise<MonitorStats> {
  try {
    return await apiRequest<MonitorStats>("/api/api_monitor/stats");
  } catch (error) {
    console.warn("Failed to fetch stats from API, using fallback data:", error);
    
    // Try to load from sample data file
    try {
      const sampleData = await import("@/data/api_monitor_sample.json");
      return sampleData.stats as MonitorStats;
    } catch {
      // Final fallback
      return {
        requests_today: 45,
        avg_duration_ms: 2450,
        success_rate: 94.7,
        pages_created_today: 12,
        recent_runs: [
          { timestamp: new Date().toISOString(), status: "success" as const, category: "lego" },
          { timestamp: new Date(Date.now() - 3600000).toISOString(), status: "success" as const, category: "whisk" },
        ],
      };
    }
  }
}

export async function fetchMonitorLogs(): Promise<ApiRun[]> {
  try {
    return await apiRequest<ApiRun[]>("/api/api_monitor/logs");
  } catch (error) {
    console.warn("Failed to fetch logs from API, using fallback data:", error);
    
    try {
      const sampleData = await import("@/data/api_monitor_sample.json");
      return sampleData.runs as ApiRun[];
    } catch {
      return [];
    }
  }
}
