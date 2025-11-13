// Core UI components and providers
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout and page components
import { Layout } from "./components/Layout";
import Investments from "./pages/Investments";
import Home from "./pages/Home";
import BankConnections from "./pages/BankConnections";
import TransactionsMonitor from "./pages/TransactionsMonitor";
import RecipeImporter from "./pages/RecipeImporter";
import NotionCoverStudio from "./pages/NotionCoverStudio";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "next-themes";


// Initialize React Query client for data fetching and caching
const queryClient = new QueryClient();

/**
 * Main App Component
 * 
 * Sets up the application with necessary providers:
 * - QueryClientProvider: Manages server state and caching
 * - TooltipProvider: Enables tooltips throughout the app
 * - BrowserRouter: Handles client-side routing
 * - Layout: Provides consistent page structure with sidebar
 * 
 * Routes are organized by feature area (finance tools, utility tools, etc.)
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        {/* Toast notification components for user feedback */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Main landing page */}
              <Route path="/" element={<Home />} />
              
              {/* Finance section pages */}
              <Route path="/bank-connections" element={<BankConnections />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/transactions-monitor2" element={<TransactionsMonitor />} />
              
              {/* Tools section pages */}
              <Route path="/recipe-importer" element={<RecipeImporter />} />
              <Route path="/notion-cover-studio" element={<NotionCoverStudio />} />
              <Route path="/documentation" element={<Documentation />} />
              
              {/* 404 catch-all route - MUST be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
