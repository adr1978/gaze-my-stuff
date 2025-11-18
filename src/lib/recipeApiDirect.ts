/**
 * TEMPORARY: Direct Gemini API calls for testing
 * This file should be DELETED once backend implementation is verified working
 */

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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeRecipeDirect(url: string): Promise<RecipeData> {
  try {
    // Fetch HTML content
    const htmlResponse = await fetch(url);
    if (!htmlResponse.ok) {
      throw new Error('Failed to fetch recipe URL');
    }
    const htmlContent = await htmlResponse.text();
    
    // Truncate if too large
    const truncatedHtml = htmlContent.length > 50000 
      ? htmlContent.substring(0, 50000) 
      : htmlContent;

    const systemPrompt = `You are a recipe extraction assistant. Extract recipe details from the provided HTML and return ONLY a JSON object with this exact structure:
{
  "name": "Recipe name",
  "imageUrl": "URL of recipe image",
  "servings": "Number of servings",
  "prepTime": "Preparation time in minutes",
  "cookTime": "Cooking time in minutes",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"]
}

Rules:
- Return ONLY valid JSON, no markdown formatting
- If a field is not found, use null
- Times should be numbers only (e.g., "30" not "30 minutes")
- Split instructions into separate steps
- Keep ingredient formatting simple and clean`;

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nHTML content:\n${truncatedHtml}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content) {
      throw new Error('Invalid response from Gemini API');
    }

    let generatedText = data.candidates[0].content.parts[0].text.trim();
    
    // Remove markdown code blocks if present
    if (generatedText.startsWith('```')) {
      generatedText = generatedText.replace(/^```(?:json)?\s*\n/, '');
      generatedText = generatedText.replace(/\n```\s*$/, '');
    }
    
    const recipeData = JSON.parse(generatedText);
    recipeData.url = url;
    
    return recipeData;
  } catch (error) {
    console.error('Direct Gemini API call failed:', error);
    throw error;
  }
}
