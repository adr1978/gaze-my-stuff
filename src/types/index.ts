import { PatternType } from "@/components/PatternControls";

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
  thumbnailUrl: string; // Data URL for the preview
  scale: number;
  rotation: number;
  opacity: number;
  position: { x: number; y: number };
  pattern: PatternType;
  spacing: number;
  randomPatternData: RandomPatternData[];
  initialState: LayerInitialState; // NEW: Store initial state for resetting
}