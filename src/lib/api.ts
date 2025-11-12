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
    return api.get("/api/gc/requisitions");
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
    return api.post("/api/gc/create-requisition", {
      institution_id: institutionId,
      owner: owner,
    });
  },
};

// Add this new type to src/lib/api.ts
export interface Institution {
  id: string;
  name: string;
  logo: string;
}