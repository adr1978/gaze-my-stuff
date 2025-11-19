/**
 * RecipeAnalyser Page Component
 * 
 * Main page for importing and analysing recipes from URLs.
 * Supports multiple extraction methods (AI, Waitrose parser, manual entry).
 * 
 * Key Features:
 * - URL-based recipe extraction using AI or specialised parsers
 * - Manual recipe entry option
 * - Visual display of extracted recipe data
 * - Edit and JSON view capabilities
 * - Metadata collection (source, category)
 * - Backend submission workflow
 * 
 * State Management:
 * - url: Recipe URL input
 * - recipeData: Extracted recipe information
 * - metadata: Source and category information
 * - extractionMethod: Selected extraction method (ai/waitrose/manual)
 * - Modal states for edit and JSON viewer
 * 
 * Data Flow:
 * 1. User enters URL and selects extraction method
 * 2. analyseRecipe() calls Supabase edge function or opens manual modal
 * 3. Recipe data displayed in RecipeDataCard
 * 4. User can edit via EditRecipeModal or view JSON
 * 5. Metadata added via MetadataCard
 * 6. sendToBackend() submits complete payload
 */

import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast-helper";
import { analyzeRecipeDirect } from "@/lib/recipeApiDirect";
import { RecipeSourceCard } from "@/components/recipeImporter/RecipeSourceCard";
import { RecipeDataCard } from "@/components/recipeImporter/RecipeDataCard";
import { JsonViewerModal } from "@/components/recipeImporter/JsonViewerModal";
import { EditRecipeModal } from "@/components/recipeImporter/EditRecipeModal";

// Recipe data structure interface
interface RecipeData {
  title: string | null;
  url: string | null;
  imageUrl: string | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  ingredients: string[];
  instructions: string[];
  notes: string | null;
  description: string | null;
  source: string | null;
  category: string | null;
}


// Predefined recipe categories for classification
const CATEGORIES = [
  "bread",
  "christmas",
  "drinks",
  "easter",
  "fish",
  "halloween",
  "high_protein",
  "ice_cream",
  "light_bites",
  "lunches",
  "poultry",
  "red_meat",
  "puddings",
  "sandwiches",
  "side_dishes",
  "system",
  "vegetarian",
];

// Supported extraction methods
type ExtractionMethod = "ai" | "waitrose" | "manual";

export default function RecipeAnalyser() {
  // Core state
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
   * When Manual is selected, open Edit Recipe modal with blank fields
   * Track previous method so we can revert if modal is closed without saving
   */
  useEffect(() => {
    if (extractionMethod === "manual") {
      // Store previous method to revert to if modal is cancelled
      setPreviousExtractionMethod(prevMethod => 
        prevMethod === "manual" ? "ai" : prevMethod
      );
      
      // Open edit modal with blank recipe template
      setEditedRecipe({
        title: "",
        url: url || "",
        imageUrl: "",
        servings: null,
        prep_time: null,
        cook_time: null,
        ingredients: [],
        instructions: [],
        notes: "",
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
   * If it was a new manual recipe and modal is closed without saving,
   * revert the toggle back to the previous extraction method
   */
  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open);
    
    // If closing the modal and it was a new manual entry that wasn't saved
    if (!open && isNewRecipeModal && extractionMethod === "manual" && !recipeData) {
      // Revert to previous extraction method (likely "ai")
      setExtractionMethod(previousExtractionMethod);
    }
  };

  /**
   * Decode HTML entities in text (e.g., &deg; → °)
   * Used for cleaning up scraped recipe content
   */
  const decodeHtmlEntities = (text: string): string => {
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
      console.log('Loaded recipes from localStorage:', JSON.parse(savedRecipes));
    }
  }, []);

  /**
   * Main recipe analysis function
   * Handles AI extraction, Waitrose parser, or manual entry
   * Uses backend API with fallback to direct Gemini calls
   */
  const analyzeRecipe = async () => {
    // Validation: URL required for non-manual methods
    if (!url && extractionMethod !== "manual") {
      showToast.error("Error", "Please enter a recipe URL");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Manual entry is handled by useEffect watching extractionMethod
      if (extractionMethod === "manual") {
        setIsAnalyzing(false);
        return;
      }

      let data;
      
      if (extractionMethod === "ai") {
        // Try backend first, fallback to direct API
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/recipe/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim() })
          });
          
          if (!response.ok) {
            throw new Error('Backend API failed');
          }
          
          data = await response.json();
          console.log('Recipe analyzed via backend:', data);
        } catch (backendError) {
          console.warn('Backend failed, using direct API:', backendError);
          data = await analyzeRecipeDirect(url.trim());
          console.log('Recipe analyzed via direct API:', data);
        }
      } else if (extractionMethod === "waitrose") {
        showToast.info(
          "Waitrose Parser",
          "Waitrose parser not implemented, using AI"
        );
        data = await analyzeRecipeDirect(url.trim());
      }

      if (data) {
        // Decode HTML entities in extracted data
        const decodedData = {
          ...data,
          url,
          name: data.name ? decodeHtmlEntities(data.name) : null,
          imageUrl: data.imageUrl || null,
          servings: data.servings ? decodeHtmlEntities(data.servings) : null,
          ingredients: (data.ingredients || []).map((ing: string) => decodeHtmlEntities(ing)),
          instructions: (data.instructions || []).map((inst: string) => decodeHtmlEntities(inst)),
        };

        setRecipeData(decodedData);
        
        // Save to localStorage
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        savedRecipes.push({ ...decodedData, analyzedAt: new Date().toISOString() });
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        
        showToast.success(
          "Success",
          "Recipe analyzed successfully!"
        );
      }
    } catch (error) {
      console.error("Error analyzing recipe:", error);
      showToast.error(
        "Unable to Analyze",
        "Could not extract recipe data from this URL"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Send complete recipe data to backend (Whisk integration)
   * Validates that required fields (source, category) are present
   */
  const sendToBackend = async () => {
    if (!recipeData) return;

    // Validation: source and category are required
    if (!recipeData.source || !recipeData.category) {
      showToast.warning(
        "Missing Information",
        "Please add both source and category in the Edit Recipe modal"
      );
      return;
    }

    // Placeholder for actual Whisk API integration
    console.log("Sending to Whisk:", recipeData);
    
    showToast.info(
      "Ready to Send",
      "Recipe data logged to console (Whisk integration pending)"
    );
  };

  /**
   * Format time from minutes to human-readable string
   * Examples: 15 → "15 mins", 90 → "1 hr 30 mins"
   */
  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} mins`;
    } else if (mins === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${mins} mins`;
    }
  };

  /**
   * Open edit modal with current recipe data
   * Used when clicking "Edit Recipe" button
   */
  const openEditModal = () => {
    setEditedRecipe(recipeData);
    setIsNewRecipeModal(false);
    setIsEditModalOpen(true);
  };

  /**
   * Split instruction text into individual sentences
   * Handles newlines and sentence punctuation (. ! ?)
   * Each sentence becomes a separate array element
   */
  const splitInstructionsIntoSentences = (text: string): string[] => {
    // Split by newlines first to preserve intentional line breaks
    const lines = text.split('\n');
    const sentences: string[] = [];
    
    lines.forEach(line => {
      // Split by sentence endings (. ! ?) followed by space or end of string
      const lineSentences = line
        .split(/([.!?])\s+/)
        .reduce((acc: string[], curr, idx, arr) => {
          if (idx % 2 === 0) {
            // This is the sentence content
            const nextPunctuation = arr[idx + 1] || '';
            const sentence = (curr + nextPunctuation).trim();
            if (sentence.length > 0) {
              acc.push(sentence);
            }
          }
          return acc;
        }, []);
      
      sentences.push(...lineSentences);
    });
    
    return sentences.filter(s => s.length > 0);
  };

  /**
   * Save edited recipe data from modal
   * Parses ingredients and instructions, updates recipe data state
   */
  const saveEditedRecipe = () => {
    if (!editedRecipe) return;

    // Parse ingredients: split by newlines, filter empty lines
    const parsedIngredients = editedRecipe.ingredients
      .join('\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Parse instructions: split into sentences automatically
    const instructionsText = editedRecipe.instructions.join('\n');
    const parsedInstructions = splitInstructionsIntoSentences(instructionsText);

    setRecipeData({
      ...editedRecipe,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
    });

    setIsEditModalOpen(false);
    setIsNewRecipeModal(false);
    showToast.success(
      "Recipe Updated",
      "Your changes have been saved"
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page header with reduced spacing */}
        <h1 className="text-4xl font-bold text-foreground mb-2">Recipe Importer</h1>
        <p className="text-muted-foreground mb-6">
          Analyse recipe URLs to extract structured data
        </p>

        <div className="grid gap-6">
          {/* URL input and extraction method selection */}
          <RecipeSourceCard
            url={url}
            setUrl={setUrl}
            extractionMethod={extractionMethod}
            setExtractionMethod={setExtractionMethod}
            isAnalyzing={isAnalyzing}
            onAnalyze={analyzeRecipe}
          />

          {/* Display extracted recipe data if available */}
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


        {/* JSON viewer modal - displays complete recipe data */}
        <JsonViewerModal
          isOpen={isJsonModalOpen}
          onOpenChange={setIsJsonModalOpen}
          recipeData={recipeData}
        />

        {/* Edit recipe modal - handles both new manual entry and editing existing recipes */}
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