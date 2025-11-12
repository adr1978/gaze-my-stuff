import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-4">Documentation</h1>
        <p className="text-muted-foreground mb-8">
          Complete documentation for recreating and integrating this application
        </p>

        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted p-1">
            <TabsTrigger 
              value="design" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Design Prompt
            </TabsTrigger>
            <TabsTrigger 
              value="integration"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Integration Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Complete Design Prompt</h2>
              <div className="prose prose-sm max-w-none space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm space-y-2">
                  <p className="font-bold text-lg">Project Overview:</p>
                  <p>
                    Create a modern financial management application with integrated banking connections and recipe management tools.
                    The application uses React, TypeScript, Tailwind CSS, and shadcn/ui components.
                  </p>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Design System & Color Palette</h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold">Colors (HSL format):</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Background:</strong> 220 15% 97% (light mode) / 222.2 84% 4.9% (dark mode)</li>
                      <li><strong>Foreground:</strong> 224 15% 20% (light mode) / 210 40% 98% (dark mode)</li>
                      <li><strong>Primary:</strong> 217 91% 60% (bright blue)</li>
                      <li><strong>Card:</strong> 0 0% 100% (white) with subtle shadows</li>
                      <li><strong>Muted:</strong> 220 14% 96% for subtle backgrounds</li>
                      <li><strong>Border:</strong> 220 13% 91% for consistent borders</li>
                      <li><strong>Warning:</strong> 38 92% 50% (orange)</li>
                      <li><strong>Success:</strong> 142 71% 45% (green)</li>
                      <li><strong>Destructive:</strong> 0 84% 60% (red)</li>
                    </ul>
                    <p className="font-semibold mt-4">Typography:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Page titles: text-4xl font-bold</li>
                      <li>Section headings: text-2xl font-semibold</li>
                      <li>Body text: text-base</li>
                      <li>Muted text: text-muted-foreground</li>
                      <li>Monospace for code/URLs: font-mono</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Layout Principles</h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Container:</strong> max-w-7xl mx-auto for consistent page width</li>
                      <li><strong>Spacing:</strong> p-8 for page padding, space-y-6 for vertical rhythm</li>
                      <li><strong>Cards:</strong> Use shadcn Card components with p-6 padding</li>
                      <li><strong>Responsive:</strong> Mobile-first approach, collapsible sidebar on small screens</li>
                      <li><strong>Navigation:</strong> Left sidebar with logo, navigation links, and footer</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Component Patterns</h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold">Buttons:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Primary actions: rounded-full with icons from lucide-react</li>
                      <li>Icons positioned before text with mr-2 spacing</li>
                      <li>Disabled state with opacity-50</li>
                      <li>Loading state with Loader2 icon and animate-spin</li>
                    </ul>
                    <p className="font-semibold mt-4">Forms:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Textareas with bg-card for subtle background contrast</li>
                      <li>Labels with text-sm font-medium mb-2</li>
                      <li>Input validation with error messages via toast notifications</li>
                      <li>Placeholder text with helpful examples</li>
                    </ul>
                    <p className="font-semibold mt-4">Cards:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Shadow-sm for subtle depth</li>
                      <li>Rounded corners using --radius (0.75rem)</li>
                      <li>Consistent p-6 internal padding</li>
                      <li>Border using border-border</li>
                    </ul>
                    <p className="font-semibold mt-4">Icons:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All icons from lucide-react library</li>
                      <li>Standard size: h-4 w-4</li>
                      <li>Consistent spacing with mr-2 when next to text</li>
                      <li>Use semantic icons (Upload for import, Loader2 for loading, Plus for add)</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Page Structure</h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold">Navigation Structure:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Home:</strong> Landing page with overview</li>
                      <li><strong>Transactions:</strong> Financial transaction management</li>
                      <li><strong>Bank Connections (GoCardless):</strong> Bank account linking and sync management</li>
                      <li><strong>Tools Section:</strong>
                        <ul className="list-disc list-inside ml-6 mt-1">
                          <li>Recipe Importer: Bulk import recipes from URLs</li>
                          <li>Instructions: This page with design and integration docs</li>
                        </ul>
                      </li>
                    </ul>
                    <p className="font-semibold mt-4">Common Page Structure:</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`<div className="min-h-screen bg-background p-8">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-4xl font-bold text-foreground mb-4">
      Page Title
    </h1>
    <p className="text-muted-foreground mb-8">
      Page description
    </p>
    {/* Page content */}
  </div>
</div>`}
                    </pre>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">User Interactions</h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Feedback:</strong> Use sonner toast notifications for all user actions</li>
                      <li><strong>Loading States:</strong> Show spinner icons and disable buttons during async operations</li>
                      <li><strong>Validation:</strong> Provide immediate feedback for invalid inputs</li>
                      <li><strong>Modals:</strong> Use shadcn Dialog components for confirmations and forms</li>
                      <li><strong>Switches:</strong> Use shadcn Switch component for toggle functionality</li>
                      <li><strong>Success Messages:</strong> Toast with success variant showing what was accomplished</li>
                      <li><strong>Error Messages:</strong> Toast with error variant explaining what went wrong</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Key Features by Page</h3>
                  
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold">GoCardless (Bank Connections):</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Display requisitions with account details</li>
                      <li>Toggle sync status per account</li>
                      <li>Reconfirm connections with toast feedback</li>
                      <li>Add new connections via modal</li>
                      <li>Show account metadata: institution, last 4 digits, type, status</li>
                      <li>Expiration countdown in days</li>
                    </ul>

                    <p className="font-semibold mt-4">Recipe Importer:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Textarea for URL input (newline or comma-separated)</li>
                      <li>Upload icon on import button</li>
                      <li>Animated spinner during processing</li>
                      <li>Card background for textarea contrast</li>
                      <li>Clear input after successful import</li>
                      <li>Success toast with count of recipes imported</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Technical Stack</h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Framework:</strong> React 18 with TypeScript</li>
                      <li><strong>Build Tool:</strong> Vite</li>
                      <li><strong>Routing:</strong> React Router DOM v6</li>
                      <li><strong>Styling:</strong> Tailwind CSS with custom design tokens</li>
                      <li><strong>Components:</strong> shadcn/ui (Radix UI primitives)</li>
                      <li><strong>Icons:</strong> lucide-react</li>
                      <li><strong>Notifications:</strong> sonner</li>
                      <li><strong>Theme:</strong> next-themes for dark/light mode</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Complete Prompt Script</h3>
                  <div className="bg-background p-4 rounded-lg border">
                    <pre className="text-xs whitespace-pre-wrap">
{`Create a modern financial management application with the following specifications:

TECH STACK:
- React 18 + TypeScript + Vite
- Tailwind CSS with custom HSL color system
- shadcn/ui components (Radix UI)
- lucide-react icons
- React Router DOM for routing
- sonner for toast notifications

DESIGN SYSTEM:
Colors (HSL):
- Background: 220 15% 97% (light) / 222.2 84% 4.9% (dark)
- Primary: 217 91% 60% (blue)
- Card: white with subtle shadows
- Muted: 220 14% 96%
- Border: 220 13% 91%
- Always use semantic tokens from design system, never direct colors

Typography:
- Page titles: text-4xl font-bold
- Sections: text-2xl font-semibold
- Body: text-base
- Use font-mono for code/URLs

LAYOUT:
- max-w-7xl mx-auto containers
- p-8 page padding
- Left sidebar navigation with logo
- Rounded-full buttons with icons
- Card components with p-6 padding
- Mobile-responsive collapsible sidebar

PAGES:
1. Home - Overview/landing
2. Transactions - Financial data
3. Bank Connections (GoCardless) - Requisitions with account sync toggles
4. Tools:
   - Recipe Importer: Textarea for URLs, Upload icon, animated spinner, success toasts
   - Instructions: Design and integration documentation

INTERACTION PATTERNS:
- All user actions show toast feedback (success/error)
- Loading states with Loader2 spinning icon
- Form validation with immediate feedback
- Buttons disabled during async operations
- Icons always h-4 w-4 with mr-2 spacing

COMPONENT PATTERNS:
- Import icons from lucide-react individually
- Use shadcn Dialog for modals
- Use shadcn Switch for toggles
- Consistent rounded-lg on cards
- Shadow-sm for subtle depth
- bg-card for form inputs needing contrast

Maintain clean, typed React code with proper component separation.`}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">FastAPI Backend Integration Guide</h2>
              
              <div className="prose prose-sm max-w-none space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Project Structure Overview</h3>
                  <p className="text-sm mb-3">
                    Your application should be organized as two separate but connected projects:
                  </p>
                  <pre className="bg-background p-3 rounded text-xs">
{`your-project/
├── frontend/              # This Lovable React application
│   ├── src/
│   ├── public/
│   ├── dist/             # Built files (after npm run build)
│   └── package.json
│
└── backend/              # Your FastAPI application
    ├── app/
    │   ├── main.py      # FastAPI app entry point
    │   ├── routes/      # API endpoints
    │   ├── models/      # Data models
    │   └── services/    # Business logic
    ├── requirements.txt
    └── Dockerfile`}
                  </pre>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 1: Backend API Structure (FastAPI)</h3>
                  
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-sm">File: backend/app/main.py</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import recipes, gocardless, transactions

app = FastAPI(title="Financial Management API")

# CORS configuration for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:4173",  # Vite preview
        "https://yourdomain.com"  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(gocardless.router, prefix="/api/gocardless", tags=["gocardless"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}`}
                    </pre>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-sm">File: backend/app/routes/recipes.py</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List
import httpx
from bs4 import BeautifulSoup

router = APIRouter()

class RecipeImportRequest(BaseModel):
    urls: List[HttpUrl]

class RecipeData(BaseModel):
    url: str
    title: str
    ingredients: List[str]
    instructions: List[str]
    image_url: str | None = None

class RecipeImportResponse(BaseModel):
    success: bool
    imported_count: int
    failed_count: int
    recipes: List[RecipeData]

@router.post("/import", response_model=RecipeImportResponse)
async def import_recipes(request: RecipeImportRequest):
    """
    Import recipes from Waitrose URLs, scrape data, upload to Whisk
    """
    recipes = []
    failed = 0
    
    for url in request.urls:
        try:
            # Scrape Waitrose recipe page
            recipe_data = await scrape_waitrose_recipe(str(url))
            
            # Upload to Whisk API
            whisk_result = await upload_to_whisk(recipe_data)
            
            recipes.append(recipe_data)
        except Exception as e:
            failed += 1
            print(f"Failed to import {url}: {e}")
    
    return RecipeImportResponse(
        success=True,
        imported_count=len(recipes),
        failed_count=failed,
        recipes=recipes
    )

async def scrape_waitrose_recipe(url: str) -> RecipeData:
    """
    Scrape recipe data from Waitrose URL
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Example scraping logic (adjust selectors for actual Waitrose site)
        title = soup.find('h1', class_='recipe-title').text
        ingredients = [li.text for li in soup.find_all('li', class_='ingredient')]
        instructions = [p.text for p in soup.find_all('p', class_='instruction')]
        image = soup.find('img', class_='recipe-image')
        
        return RecipeData(
            url=url,
            title=title,
            ingredients=ingredients,
            instructions=instructions,
            image_url=image['src'] if image else None
        )

async def upload_to_whisk(recipe: RecipeData) -> dict:
    """
    Upload recipe data to Whisk API
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.whisk.com/recipes",  # Replace with actual Whisk API
            json=recipe.dict(),
            headers={"Authorization": "Bearer YOUR_WHISK_API_KEY"}
        )
        return response.json()`}
                    </pre>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-sm">File: backend/app/routes/gocardless.py</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class Account(BaseModel):
    id: str
    institution_name: str
    last4: str
    type: str
    sync_enabled: bool

class Requisition(BaseModel):
    id: str
    reference: str
    owner: str
    created: str
    status: str
    expires_in_days: int
    accounts: List[Account]

@router.get("/requisitions", response_model=List[Requisition])
async def get_requisitions():
    """
    Fetch all bank requisitions from GoCardless
    """
    # Your GoCardless API integration here
    # Example return:
    return [
        Requisition(
            id="1",
            reference="demo_connection",
            owner="Unknown",
            created="17-Aug-2025 (17:19)",
            status="LN",
            expires_in_days=10,
            accounts=[
                Account(
                    id="acc1",
                    institution_name="Demo Bank",
                    last4="1234",
                    type="CACC",
                    sync_enabled=False
                )
            ]
        )
    ]

@router.put("/accounts/{account_id}/sync")
async def toggle_sync(account_id: str, enabled: bool):
    """
    Toggle sync status for a specific account
    """
    # Your sync toggle logic here
    return {"success": True, "account_id": account_id, "sync_enabled": enabled}`}
                    </pre>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 2: Frontend API Integration</h3>
                  
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-sm">Create: src/lib/api.ts</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`// API base URL - change based on environment
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
    const url = \`\${this.baseUrl}\${endpoint}\`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(\`API Error: \${response.statusText}\`);
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

// Recipe API functions
export const recipeApi = {
  importRecipes: async (urls: string[]) => {
    return api.post("/api/recipes/import", { urls });
  },
};

// GoCardless API functions
export const gocardlessApi = {
  getRequisitions: async () => {
    return api.get("/api/gocardless/requisitions");
  },
  toggleSync: async (accountId: string, enabled: boolean) => {
    return api.put(\`/api/gocardless/accounts/\${accountId}/sync\`, { enabled });
  },
};`}
                    </pre>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-sm">Update: src/pages/Recipes.tsx</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { recipeApi } from "@/lib/api";

export default function Recipes() {
  const [urls, setUrls] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!urls.trim()) {
      toast.error("Please enter at least one URL");
      return;
    }

    setIsImporting(true);
    
    // Parse URLs
    const urlList = urls
      .split(/[\\n,]+/)
      .map(url => url.trim())
      .filter(url => url.length > 0);

    try {
      // Call backend API
      const response = await recipeApi.importRecipes(urlList);
      
      toast.success(
        \`Successfully imported \${response.imported_count} recipe\${response.imported_count > 1 ? 's' : ''}\`
      );
      
      if (response.failed_count > 0) {
        toast.warning(\`\${response.failed_count} recipes failed to import\`);
      }
      
      setUrls("");
    } catch (error) {
      toast.error("Failed to import recipes. Please try again.");
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    // ... rest of component
  );
}`}
                    </pre>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 3: Environment Configuration</h3>
                  
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-sm">Create: frontend/.env.development</p>
                    <pre className="bg-background p-3 rounded text-xs">
{`VITE_API_URL=http://localhost:8000`}
                    </pre>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-sm">Create: frontend/.env.production</p>
                    <pre className="bg-background p-3 rounded text-xs">
{`VITE_API_URL=https://api.yourdomain.com`}
                    </pre>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-sm">Backend: backend/.env</p>
                    <pre className="bg-background p-3 rounded text-xs">
{`# Database
DATABASE_URL=postgresql://user:password@localhost/dbname

# External APIs
WHISK_API_KEY=your_whisk_api_key
GOCARDLESS_SECRET_ID=your_gocardless_secret
GOCARDLESS_SECRET_KEY=your_gocardless_key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com`}
                    </pre>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 4: Running the Application</h3>
                  
                  <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-2">Backend (FastAPI):</p>
                      <pre className="bg-background p-3 rounded text-xs">
{`# Install dependencies
cd backend
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000

# Or with Docker
docker-compose up backend`}
                      </pre>
                    </div>

                    <div>
                      <p className="font-semibold text-sm mb-2">Frontend (React):</p>
                      <pre className="bg-background p-3 rounded text-xs">
{`# Install dependencies (already done in Lovable)
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview`}
                      </pre>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 5: Deployment Options</h3>
                  
                  <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-2">Option 1: Separate Deployments (Recommended)</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><strong>Frontend:</strong> Deploy via Lovable (automatic) or Vercel/Netlify</li>
                        <li><strong>Backend:</strong> Deploy to Railway, Render, or AWS</li>
                        <li>Use CORS to connect them</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-sm mb-2">Option 2: Backend Serves Frontend</p>
                      <pre className="bg-background p-3 rounded text-xs">
{`# In FastAPI main.py
from fastapi.staticfiles import StaticFiles

# After building frontend (npm run build)
app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")`}
                      </pre>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-accent/20 border-l-4 border-accent p-4 rounded">
                  <h3 className="text-lg font-semibold mb-2">Key Integration Points</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Recipe Importer:</strong> POST /api/recipes/import with {"{ urls: string[] }"}</li>
                    <li><strong>GoCardless Requisitions:</strong> GET /api/gocardless/requisitions</li>
                    <li><strong>Account Sync Toggle:</strong> PUT /api/gocardless/accounts/{"{id}"}/sync</li>
                    <li><strong>Transactions:</strong> GET /api/transactions (implement as needed)</li>
                    <li>All responses should be JSON with proper error handling</li>
                    <li>Use async/await for all API calls</li>
                    <li>Toast notifications for user feedback</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}