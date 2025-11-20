# Recipe Analyser API

Backend endpoint for analysing recipe URLs using Google Gemini API.

## Setup

1. Set the `GOOGLE_GEMINI_API_KEY` environment variable
2. The endpoint will be available at `/api/recipe/analyse`

## Usage

```bash
POST /api/recipe/analyse
Content-Type: application/json

{
  "url": "https://example.com/recipe"
}
```

## Response

```json
{
  "name": "Recipe Name",
  "url": "https://example.com/recipe",
  "imageUrl": "https://example.com/image.jpg",
  "servings": "4",
  "prepTime": "15",
  "cookTime": "30",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"]
}
```

## Temporary Frontend Implementation

The file `src/lib/recipeApiDirect.ts` contains a TEMPORARY frontend implementation for testing.

**This file should be DELETED once backend is verified working.**

To test the frontend approach, you need to:
1. Add `VITE_GEMINI_API_KEY` to your `.env` file
2. The app will automatically fallback to direct API calls if backend fails

To remove the temporary frontend code:
1. Delete `src/lib/recipeApiDirect.ts`
2. Remove the import from `src/pages/RecipeImporter.tsx`
3. Remove the fallback logic in the `analyseRecipe` function
