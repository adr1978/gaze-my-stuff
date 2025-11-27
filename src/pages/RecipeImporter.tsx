/**
 * RecipeAnalyser Page Component
 * * Main page for importing and analysing recipes from URLs.
 * Supports multiple extraction methods (AI, Waitrose parser, manual entry).
 * * Key Features:
 * - URL-based recipe extraction using AI or specialised parsers
 * - Manual recipe entry option
 * - Visual display of extracted recipe data
 * - Edit and JSON view capabilities
 * - Metadata collection (source, category)
 * - Backend submission workflow
 * * State Management:
 * - url: Recipe URL input
 * - recipeData: Extracted recipe information
 * - metadata: Source and category information
 * - extractionMethod: Selected extraction method (ai/waitrose/manual)
 * - Modal states for edit and JSON viewer
 * * Data Flow:
 * 1. User enters URL and selects extraction method
 * 2. analyseRecipe() calls Supabase edge function or opens manual modal
 * 3. Recipe data displayed in RecipeDataCard
 * 4. User can edit via EditRecipeModal or view JSON
 * 5. Metadata added via MetadataCard
 * 6. sendToBackend() submits complete payload
 */

import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast-helper";
import { analyseRecipeDirect } from "@/lib/recipeApiDirect";
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
   * Note: This will now typically only contain the one active recipe
   */
  useEffect(() => {
    const savedRecipes = localStorage.getItem('savedRecipes');
    if (savedRecipes) {
      const parsed = JSON.parse(savedRecipes);
      // If there is a saved recipe, load the most recent one into view
      if (Array.isArray(parsed) && parsed.length > 0) {
        setRecipeData(parsed[parsed.length - 1]);
        console.log('Restored active recipe from session storage');
      }
    }
  }, []);

  /**
   * Main recipe analysis function
   * Handles AI extraction, Waitrose parser, or manual entry
   * Uses backend API with fallback to direct Gemini calls for AI
   */
  const analyseRecipe = async () => {
    // Validation: URL required for non-manual methods
    if (!url && extractionMethod !== "manual") {
      showToast.error("Error", "Please enter a recipe URL");
      return;
    }

    setIsAnalysing(true);
    // Clear previous data from UI immediately
    setRecipeData(null); 

    try {
      // Manual entry is handled by useEffect watching extractionMethod
      if (extractionMethod === "manual") {
        setIsAnalysing(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      let data;
      
      if (extractionMethod === "ai") {
        // Try backend first, fallback to direct API
        try {
          console.log('Calling AI backend endpoint:', `${API_BASE_URL}/api/recipe/analyse`);
          const response = await fetch(`${API_BASE_URL}/api/recipe/analyse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim() })
          });
          
          if (!response.ok) {
            throw new Error('Backend API failed');
          }
          
          data = await response.json();
          console.log('✅ Recipe analysed via AI backend:', data);
        } catch (backendError) {
          console.warn('Backend failed, using direct API:', backendError);
          data = await analyseRecipeDirect(url.trim());
          console.log('✅ Recipe analysed via direct API:', data);
        }
      } else if (extractionMethod === "waitrose") {
        // Call Waitrose parser backend endpoint
        try {
          console.log('Calling Waitrose parser endpoint:', `${API_BASE_URL}/api/recipe/parse-waitrose`);
          const response = await fetch(`${API_BASE_URL}/api/recipe/parse-waitrose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim() })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Waitrose parser failed:', errorData);
            throw new Error('Waitrose parser failed');
          }
          
          const responseData = await response.json();
          data = responseData.data; // Extract data from response wrapper
          console.log('✅ Recipe parsed via Waitrose backend:', data);
        } catch (waitroseError) {
          console.error('Waitrose parser error:', waitroseError);
          showToast.error(
            "Waitrose Parser Failed",
            "Could not parse Waitrose recipe. Please try AI extraction instead."
          );
          setIsAnalysing(false);
          return;
        }
      }

      if (data) {
        // Decode HTML entities in extracted data
        // Note: servings should already be a number from backend, don't decode it
        const decodedData = {
          ...data,
          url: data.url || url, // Use URL from response or fallback to input
          imageUrl: data.imageUrl || null,
          servings: data.servings || null,
          ingredients: (data.ingredients || []).map((ing: string) => decodeHtmlEntities(ing)),
          instructions: (data.instructions || []).map((inst: string) => decodeHtmlEntities(inst)),
        };

        setRecipeData(decodedData);
        
        // Save to localStorage - OVERWRITE previous data (clear history)
        // We only store the single active recipe now
        const currentRecipe = [{ ...decodedData, analysedAt: new Date().toISOString() }];
        localStorage.setItem('savedRecipes', JSON.stringify(currentRecipe));
        
        showToast.success(
          "Success",
          `Recipe ${extractionMethod === 'waitrose' ? 'parsed' : 'analysed'} successfully!`
        );
      }
    } catch (error) {
      console.error("Error analysing recipe:", error);
      showToast.error(
        "Unable to Analyse",
        "Could not extract recipe data from this URL"
      );
    } finally {
      setIsAnalysing(false);
    }
  };

  /**
   * Send complete recipe data to backend (Whisk integration)
   * Validates that required fields (source, category) are present
   * Uploads recipe to Samsung Food (Whisk) via backend API
   */
  const sendToBackend = async () => {
    if (!recipeData) return;

    // Validation: source and category are required for proper categorization
    if (!recipeData.source || !recipeData.category) {
      showToast.warning(
        "Missing Information",
        "Please add both source and category in the Edit Recipe modal"
      );
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      console.log('=== Starting Whisk Upload ===');
      console.log('Recipe to upload:', {
        title: recipeData.title,
        servings: recipeData.servings,
        ingredientCount: recipeData.ingredients.length,
        instructionCount: recipeData.instructions.length,
        category: recipeData.category,
        source: recipeData.source
      });

      showToast.info(
        "Uploading...",
        "Sending recipe to Samsung Food"
      );

      const response = await fetch(`${API_BASE_URL}/api/recipe/upload-whisk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Whisk upload failed:', errorData);
        throw new Error(errorData.detail?.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('✅ Whisk upload successful:', result);
      console.log('Workflow steps:', result.steps);
      console.log('=== Upload Complete ===');

      showToast.success(
        "Upload Successful",
        `Recipe "${recipeData.title}" has been saved to Samsung Food!`
      );
    } catch (error) {
      console.error('❌ Error uploading to Whisk:', error);
      showToast.error(
        "Upload Failed",
        error instanceof Error ? error.message : "Could not upload recipe to Samsung Food"
      );
    }
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

    const updatedRecipeData = {
      ...editedRecipe,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
    };

    setRecipeData(updatedRecipeData);

    // Overwrite localStorage with this new edited version (clearing any old history)
    const currentRecipe = [{ ...updatedRecipeData, analysedAt: new Date().toISOString() }];
    localStorage.setItem('savedRecipes', JSON.stringify(currentRecipe));

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
            isAnalysing={isAnalysing}
            onAnalyse={analyseRecipe}
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