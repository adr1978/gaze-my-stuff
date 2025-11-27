import { PatternType } from "@/components/notionCoverStudio/PatternControls";

// --- RECIPE IMPORTER TYPES ---

export interface RecipeItem {
  text: string;
  group: string | null;
}

// Defines the structure of recipe data returned by the Python/Gemini Backend
export interface RecipeData {
  url: string;
  title: string; 
  servings: number | null; 
  prep_time: number | null; 
  cook_time: number | null; 
  ingredients: RecipeItem[]; // Changed from string[]
  instructions: RecipeItem[]; // Changed from string[]
  imageUrl: string | null;
  description: string | null;
  source: string | null;
  category: string | null;
}

// --- NOTION COVER STUDIO TYPES ---

// Stores the random x/y, rotation, and scale for pattern generation
export type RandomPatternData = {
  x: number;
  y: number;
  rotationJitter: number;
  scaleJitter: number;
};

// Defines the initial state of a layer for reset functionality
export interface LayerInitialState {
  scale: number;
  rotation: number;
  opacity: number;
  position: { x: number; y: number };
}

// Defines all properties for a single layer
export interface LayerState {
  id: string;
  image: HTMLImageElement;
  thumbnailUrl: string; 
  scale: number;
  rotation: number;
  opacity: number;
  position: { x: number; y: number };
  pattern: PatternType;
  spacing: number;
  randomPatternData: RandomPatternData[];
  initialState: LayerInitialState; 
}