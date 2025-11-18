"""
Recipe Analysis Endpoint using Google Gemini API
Fetches HTML from URL and extracts recipe data using AI
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import requests
import json
import re

router = APIRouter()

class AnalyzeRequest(BaseModel):
    url: str

class RecipeResponse(BaseModel):
    name: str | None
    url: str | None
    imageUrl: str | None
    servings: str | None
    prepTime: str | None
    cookTime: str | None
    ingredients: list[str]
    instructions: list[str]

@router.post("/analyze", response_model=RecipeResponse)
async def analyze_recipe(request: AnalyzeRequest):
    """
    Analyze a recipe URL using Google Gemini API
    """
    try:
        # Fetch HTML content from URL
        html_response = requests.get(request.url, timeout=10)
        html_response.raise_for_status()
        html_content = html_response.text
        
        # Truncate HTML if too large (Gemini has token limits)
        if len(html_content) > 50000:
            html_content = html_content[:50000]
        
        # Get Gemini API key from environment
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # Prepare Gemini API request
        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}"
        
        system_prompt = """You are a recipe extraction assistant. Extract recipe details from the provided HTML and return ONLY a JSON object with this exact structure:
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
- Keep ingredient formatting simple and clean"""

        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{system_prompt}\n\nHTML content:\n{html_content}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 2048,
            }
        }
        
        # Call Gemini API
        gemini_response = requests.post(
            gemini_url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        gemini_response.raise_for_status()
        gemini_data = gemini_response.json()
        
        # Extract text from Gemini response
        if not gemini_data.get("candidates") or not gemini_data["candidates"][0].get("content"):
            raise HTTPException(status_code=500, detail="Invalid response from Gemini API")
        
        generated_text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Parse JSON from response (handle potential markdown wrapping)
        json_text = generated_text.strip()
        if json_text.startswith("```"):
            # Remove markdown code blocks
            json_text = re.sub(r'^```(?:json)?\s*\n', '', json_text)
            json_text = re.sub(r'\n```\s*$', '', json_text)
        
        recipe_data = json.loads(json_text)
        
        # Add the original URL
        recipe_data["url"] = request.url
        
        return recipe_data
        
    except requests.Timeout:
        raise HTTPException(status_code=408, detail="Request timeout while fetching recipe")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch URL: {str(e)}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse recipe data: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
