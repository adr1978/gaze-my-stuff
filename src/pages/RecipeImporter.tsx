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
import { supabase } from "@/integrations/supabase/client";
import { RecipeSourceCard } from "@/components/recipeImporter/RecipeSourceCard";
import { RecipeDataCard } from "@/components/recipeImporter/RecipeDataCard";
import { MetadataCard } from "@/components/recipeImporter/MetadataCard";
import { JsonViewerModal } from "@/components/recipeImporter/JsonViewerModal";
import { EditRecipeModal } from "@/components/recipeImporter/EditRecipeModal";
import { RecipeDocumentation } from "@/components/recipeImporter/RecipeDocumentation";

// Recipe data structure interface
interface RecipeData {
  name: string | null;
  url: string | null;
  imageUrl: string | null;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  ingredients: string[];
  instructions: string[];
}

// Metadata interface for source and categorization
interface RecipeMetadata {
  source: string;
  category: string;
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
  const [metadata, setMetadata] = useState<RecipeMetadata>({
    source: "",
    category: "",
  });
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
      
      // Open edit modal with blank recipe
      setEditedRecipe({
        name: "",
        url: url || "",
        imageUrl: null,
        servings: "",
        prepTime: "",
        cookTime: "",
        ingredients: [],
        instructions: [],
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
   * Main recipe analysis function
   * Handles AI extraction, Waitrose parser, or manual entry
   * based on selected extraction method
   */
  const analyzeRecipe = async () => {
    // Validation: URL required for non-manual methods
    if (!url && extractionMethod !== "manual") {
      showToast.error("Error", "Please enter a recipe URL");
      return;
    }

    setIsAnalyzing(true);
    try {
      if (extractionMethod === "waitrose") {
        // Waitrose parser endpoint (placeholder - not yet implemented)
        showToast.info(
          "Waitrose Parser Selected",
          "Using Waitrose internal parser for recipe extraction"
        );
        setIsAnalyzing(false);
        return;
      }

      // Manual entry is handled by useEffect watching extractionMethod
      if (extractionMethod === "manual") {
        setIsAnalyzing(false);
        return;
      }

      // AI Extraction method - calls Supabase edge function
      const { data, error } = await supabase.functions.invoke("analyze-recipe", {
        body: { url },
      });

      if (error) throw error;

      // Decode HTML entities in extracted data
      const decodedData = {
        ...data,
        url,
        name: data.name ? decodeHtmlEntities(data.name) : null,
        imageUrl: data.imageUrl || null,
        servings: data.servings ? decodeHtmlEntities(data.servings) : null,
        ingredients: data.ingredients.map((ing: string) => decodeHtmlEntities(ing)),
        instructions: data.instructions.map((inst: string) => decodeHtmlEntities(inst)),
      };

      setRecipeData(decodedData);
      showToast.success(
        "Success",
        `Recipe analysed successfully using ${extractionMethod === "ai" ? "AI Magic" : "Waitrose Parser"}`
      );
    } catch (error) {
      console.error("Error analysing recipe:", error);
      showToast.error(
        "Unable to Analyse",
        "Could not extract recipe data from this URL"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Send complete recipe data with metadata to backend
   * Validates metadata presence before submission
   */
  const sendToBackend = async () => {
    if (!recipeData) return;

    // Validation: metadata fields required
    if (!metadata.source || !metadata.category) {
      showToast.warning(
        "Missing Information",
        "Please fill in all metadata fields"
      );
      return;
    }

    // Combine recipe data with metadata for backend submission
    const payload = {
      ...recipeData,
      ...metadata,
    };

    // Placeholder for actual backend API call
    console.log("Sending to backend:", payload);
    
    showToast.info(
      "Ready to Send",
      "Check console for JSON payload"
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
            <>
              <RecipeDataCard
                recipeData={recipeData}
                formatTime={formatTime}
                metadata={metadata}
                onOpenEditModal={openEditModal}
                onOpenJsonModal={() => setIsJsonModalOpen(true)}
              />

              {/* Metadata collection card */}
              <MetadataCard
                metadata={metadata}
                setMetadata={setMetadata}
                categories={CATEGORIES}
                onSendToBackend={sendToBackend}
              />
            </>
          )}
        </div>

        {/* Documentation button at bottom of page */}
        <div className="mt-8 flex justify-center">
          <RecipeDocumentation />
        </div>

        {/* JSON viewer modal */}
        <JsonViewerModal
          isOpen={isJsonModalOpen}
          onOpenChange={setIsJsonModalOpen}
          recipeData={recipeData}
          metadata={metadata}
        />

        {/* Edit recipe modal with special handling for Manual toggle */}
        <EditRecipeModal
          isOpen={isEditModalOpen}
          onOpenChange={handleEditModalClose}
          editedRecipe={editedRecipe}
          setEditedRecipe={setEditedRecipe}
          isNewRecipe={isNewRecipeModal}
          categories={CATEGORIES}
          metadata={metadata}
          setMetadata={setMetadata}
          onSave={saveEditedRecipe}
        />
      </div>
    </div>
  );
}