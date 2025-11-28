/**
 * RecipeAnalyser Page Component
 * * Main page for importing and analysing recipes from URLs.
 * * UPDATES:
 * - Updated RecipeData interface to support grouped ingredients/instructions (RecipeItem[]).
 * - Fixed data decoding logic to handle objects instead of strings.
 * - Simplified save logic (delegates parsing to EditRecipeModal).
 */

import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast-helper";
import { analyseRecipeDirect } from "@/lib/recipeApiDirect";
import { RecipeSourceCard } from "@/components/recipeImporter/RecipeSourceCard";
import { RecipeDataCard } from "@/components/recipeImporter/RecipeDataCard";
import { JsonViewerModal } from "@/components/recipeImporter/JsonViewerModal";
import { EditRecipeModal } from "@/components/recipeImporter/EditRecipeModal";

// --- Types ---

// Defines a single item with optional grouping
export interface RecipeItem {
  text: string;
  group: string | null;
}

// Updated Recipe data structure interface matching backend and components
export interface RecipeData {
  title: string | null;
  url: string | null;
  imageUrl: string | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  ingredients: RecipeItem[];   // Changed from string[]
  instructions: RecipeItem[];  // Changed from string[]
  description: string | null;
  source: string | null;
  category: string | string[] | null;
}

// Predefined recipe categories for classification
const CATEGORIES = [
  "Bread",
  "Christmas",
  "Drinks",
  "Easter",
  "Fish",
  "Halloween",
  "High Protein",
  "Ice Cream",
  "Light Bites",
  "Lunches",
  "Meat (Poultry)",
  "Meat (Red)",
  "Puddings",
  "Sandwiches",
  "Side Dishes",
  "Vegetarian",
];

// Supported extraction methods
type ExtractionMethod = "ai" | "waitrose" | "manual";

export default function RecipeAnalyser() {
  // Core state
  const [url, setUrl] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [recipeData, setRecipeData] = useState<RecipeData | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<ExtractionMethod>("ai");
  const [previousExtractionMethod, setPreviousExtractionMethod] = useState<ExtractionMethod>("ai");
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<RecipeData | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isNewRecipeModal, setIsNewRecipeModal] = useState(false);

  /**
   * Handle Manual toggle selection
   */
  useEffect(() => {
    if (extractionMethod === "manual") {
      setPreviousExtractionMethod(prevMethod => 
        prevMethod === "manual" ? "ai" : prevMethod
      );
      
      setEditedRecipe({
        title: "",
        url: url || "",
        imageUrl: "",
        servings: null,
        prep_time: null,
        cook_time: null,
        ingredients: [],
        instructions: [],
        description: "",
        source: "",
        category: "",
      });
      setIsNewRecipeModal(true);
      setIsEditModalOpen(true);
    }
  }, [extractionMethod, url]);

  /**
   * Handle Edit Modal close
   */
  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open && isNewRecipeModal && extractionMethod === "manual" && !recipeData) {
      setExtractionMethod(previousExtractionMethod);
    }
  };

  /**
   * Decode HTML entities in text (e.g., &deg; → °)
   */
  const decodeHtmlEntities = (text: string): string => {
    if (!text) return "";
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  /**
   * Load saved recipes from localStorage on mount
   */
  useEffect(() => {
    const savedRecipes = localStorage.getItem('savedRecipes');
    if (savedRecipes) {
      const parsed = JSON.parse(savedRecipes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setRecipeData(parsed[parsed.length - 1]);
        console.log('Restored active recipe from session storage');
      }
    }
  }, []);

  /**
   * Main recipe analysis function
   */
  const analyseRecipe = async () => {
    if (!url && extractionMethod !== "manual") {
      showToast.error("Error", "Please enter a recipe URL");
      return;
    }

    setIsAnalysing(true);
    setRecipeData(null); 

    try {
      if (extractionMethod === "manual") {
        setIsAnalysing(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      let data;
      
      if (extractionMethod === "ai") {
        try {
          console.log('Calling AI backend endpoint:', `${API_BASE_URL}/api/recipe/analyse`);
          const response = await fetch(`${API_BASE_URL}/api/recipe/analyse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim() })
          });
          
          if (!response.ok) throw new Error('Backend API failed');
          data = await response.json();
        } catch (backendError) {
          console.warn('Backend failed, using direct API fallback (might not support groups):', backendError);
          // Note: Direct API fallback might still return strings, so we handle that below
          data = await analyseRecipeDirect(url.trim());
        }
      } else if (extractionMethod === "waitrose") {
        try {
          console.log('Calling Waitrose parser endpoint:', `${API_BASE_URL}/api/recipe/parse-waitrose`);
          const response = await fetch(`${API_BASE_URL}/api/recipe/parse-waitrose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim() })
          });
          
          if (!response.ok) throw new Error('Waitrose parser failed');
          const responseData = await response.json();
          data = responseData.data; 
        } catch (waitroseError) {
          console.error('Waitrose parser error:', waitroseError);
          showToast.error("Waitrose Parser Failed", "Could not parse Waitrose recipe.");
          setIsAnalysing(false);
          return;
        }
      }

      if (data) {
        // --- DATA MAPPING FIX ---
        // We must handle both object arrays (new backend) and string arrays (old fallback/direct api)
        // and safely decode HTML entities on the 'text' property.

        const processItems = (items: any[]): RecipeItem[] => {
          if (!items) return [];
          return items.map((item) => {
            if (typeof item === 'string') {
              // Legacy string support
              return { text: decodeHtmlEntities(item), group: null };
            } else {
              // Object support (Backend)
              return {
                text: decodeHtmlEntities(item.text || ""),
                group: item.group || null // Preserve null/string group
              };
            }
          });
        };

        const decodedData: RecipeData = {
          title: data.title,
          description: data.description,
          url: data.url || url,
          imageUrl: data.imageUrl || null,
          servings: data.servings || null,
          prep_time: data.prep_time,
          cook_time: data.cook_time,
          source: data.source,
          category: data.category,
          // Process ingredients and instructions using the safe mapper
          ingredients: processItems(data.ingredients),
          instructions: processItems(data.instructions),
        };

        setRecipeData(decodedData);
        
        const currentRecipe = [{ ...decodedData, analysedAt: new Date().toISOString() }];
        localStorage.setItem('savedRecipes', JSON.stringify(currentRecipe));
        
        showToast.success(
          "Success",
          `Recipe ${extractionMethod === 'waitrose' ? 'parsed' : 'analysed'} successfully!`
        );
      }
    } catch (error) {
      console.error("Error analysing recipe:", error);
      showToast.error("Unable to Analyse", "Could not extract recipe data from this URL");
    } finally {
      setIsAnalysing(false);
    }
  };

  /**
   * Send complete recipe data to backend
   */
  const sendToBackend = async () => {
    if (!recipeData) return;

    if (!recipeData.source || !recipeData.category) {
      showToast.warning("Missing Information", "Please add source and category.");
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      showToast.info("Uploading...", "Sending recipe to Samsung Food");

      const response = await fetch(`${API_BASE_URL}/api/recipe/upload-whisk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || 'Upload failed');
      }

      showToast.success("Upload Successful", `Recipe "${recipeData.title}" saved!`);
    } catch (error) {
      console.error('❌ Error uploading:', error);
      showToast.error("Upload Failed", error instanceof Error ? error.message : "Upload error");
    }
  };

  /**
   * Format time helper
   */
  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} mins`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} mins`;
  };

  /**
   * Open edit modal
   */
  const openEditModal = () => {
    setEditedRecipe(recipeData);
    setIsNewRecipeModal(false);
    setIsEditModalOpen(true);
  };

  /**
   * Save edited recipe
   * * UPDATED: No longer re-parses strings. 
   * * The EditRecipeModal now correctly returns RecipeItem[] structure in `editedRecipe`.
   */
  const saveEditedRecipe = () => {
    if (!editedRecipe) return;

    // Directly set the data, as EditRecipeModal now manages the structure (RecipeItem[])
    setRecipeData(editedRecipe);

    const currentRecipe = [{ ...editedRecipe, analysedAt: new Date().toISOString() }];
    localStorage.setItem('savedRecipes', JSON.stringify(currentRecipe));

    setIsEditModalOpen(false);
    setIsNewRecipeModal(false);
    showToast.success("Recipe Updated", "Your changes have been saved");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2">Recipe Importer</h1>
        <p className="text-muted-foreground mb-6">
          Analyse recipe URLs to extract structured data
        </p>

        <div className="grid gap-6">
          <RecipeSourceCard
            url={url}
            setUrl={setUrl}
            extractionMethod={extractionMethod}
            setExtractionMethod={setExtractionMethod}
            isAnalysing={isAnalysing}
            onAnalyse={analyseRecipe}
          />

          {recipeData && (
            <RecipeDataCard
              recipeData={recipeData}
              formatTime={formatTime}
              onOpenEditModal={openEditModal}
              onOpenJsonModal={() => setIsJsonModalOpen(true)}
              onSendToBackend={sendToBackend}
            />
          )}
        </div>

        <JsonViewerModal
          isOpen={isJsonModalOpen}
          onOpenChange={setIsJsonModalOpen}
          recipeData={recipeData}
        />

        <EditRecipeModal
          isOpen={isEditModalOpen}
          onOpenChange={handleEditModalClose}
          editedRecipe={editedRecipe}
          setEditedRecipe={setEditedRecipe}
          isNewRecipe={isNewRecipeModal}
          categories={CATEGORIES}
          onSave={saveEditedRecipe}
        />
      </div>
    </div>
  );
}