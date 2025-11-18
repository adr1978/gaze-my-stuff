// API base URL - change based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Generic API client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Recipe API types
interface RecipeData {
  url: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  image_url?: string;
}

interface RecipeImportResponse {
  success: boolean;
  imported_count: number;
  failed_count: number;
  recipes: RecipeData[];
}

// Recipe API functions
export const recipeApi = {
  importRecipes: async (urls: string[]): Promise<RecipeImportResponse> => {
    return api.post("/api/recipes/import", { urls });
  },
};

// GoCardless API types
export interface Account { // <-- THE FIX: Added export
  account_id: string; 
  institution_name: string;
  last_four: string; 
  account_type: string; 
  sync_enabled: boolean;
  
  owner_name?: string;
  name?: string;
  scan?: string;
  currency?: string;
  last_synced?: string | null;
  last_api_call?: string | null;
  sync_status?: string;
}

export interface Requisition { // <-- THE FIX: Added export
  id: string;
  reference: string;
  owner: string;
  created: string;
  status: string;
  expiresInDays: number;
  accounts: Account[];
  
  agreement: string;
  institution_id: string;
  link: string;
  redirect: string;
  notes?: string | null;
}

// GoCardless API functions
export const gocardlessApi = {
  getRequisitions: async (): Promise<Requisition[]> => {
    try {
      return await api.get("/api/gc/requisitions");
    } catch (error) {
      console.warn("GoCardless API call failed, using mock data:", error);
      // Import mock data as fallback
      const mockResponse = await import("@/data/sample_gc_response.json");
      const mockMetadata = await import("@/data/sample_gc_metadata.json");
      
      // Merge API response with local metadata
      return mockResponse.results.map((req: any) => {
        const metadata = mockMetadata.default[req.id] || {};
        return {
          id: req.id,
          reference: req.reference,
          owner: metadata.owner || "Unknown",
          created: req.created,
          status: req.status,
          expiresInDays: 90, // Default value
          agreement: req.agreement,
          institution_id: req.institution_id,
          link: req.link,
          redirect: req.redirect,
          notes: metadata.notes || null,
          accounts: metadata.accounts || [],
        };
      });
    }
  },
  toggleSync: async (requisitionId: string, accountId: string, enabled: boolean) => {
    return api.post(`/api/gc/toggle-sync/${requisitionId}/${accountId}`, {});
  },
  reconfirm: async (agreementId: string): Promise<{ reconfirm_link: string }> => {
    return api.get(`/api/gc/reconfirm/${agreementId}`);
  },
  getInstitutions: async (): Promise<Institution[]> => {
    return api.get("/api/gc/institutions");
  },
  createRequisition: async (
    institutionId: string, 
    owner: string
  ): Promise<{ link: string; requisition_id: string }> => {
    // 1. The STABLE URL for the FastAPI server (e.g., http://localhost:8000)
    const apiBaseUrl = API_BASE_URL; 
    
    // 2. The DYNAMIC URL for the user's browser (e.g., http://localhost:8080 or https://hub.domain.com)
    const frontendBaseUrl = window.location.origin;
    
    return api.post("/api/gc/create-requisition", {
      institution_id: institutionId,
      owner: owner,
      api_base_url: apiBaseUrl, 
      frontend_base_url: frontendBaseUrl,
    });
  },
};

// Add this new type to src/lib/api.ts
export interface Institution {
  id: string;
  name: string;
  logo: string;
}

// Webhook API types
export interface Webhook {
  id: string;
  timestamp: string;
  method: 'POST' | 'PUT' | 'GET' | 'DELETE' | 'PATCH';
  endpoint: string;
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

interface WebhooksResponse {
  webhooks: Webhook[];
  count: number;
  last_updated: string | null;
}

// Webhook API functions
export const webhookApi = {
  getWebhooks: async (lastChecked?: string): Promise<WebhooksResponse> => {
    try {
      const params = lastChecked ? `?last_checked=${encodeURIComponent(lastChecked)}` : '';
      return await api.get(`/api/webhooks/webhooks${params}`);
    } catch (error) {
      console.warn("Webhook API call failed, using sample data:", error);
      // Import sample data as fallback
      const sampleData = await import("@/data/webhooks_sample.json");
      
      // Filter by lastChecked if provided
      let webhooks = sampleData.default as Webhook[];
      if (lastChecked) {
        const lastCheckedDate = new Date(lastChecked);
        webhooks = webhooks.filter((wh) => new Date(wh.timestamp) > lastCheckedDate);
      }
      
      return {
        webhooks,
        count: webhooks.length,
        last_updated: webhooks.length > 0 ? webhooks[0].timestamp : null
      };
    }
  },
};