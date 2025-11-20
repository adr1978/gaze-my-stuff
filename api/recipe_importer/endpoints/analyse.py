import logging
import os 
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List

# Import Google GenAI SDK components
from google import genai
from google.genai import types 

# --- Configuration ---
logger = logging.getLogger("uvicorn.error")

# IMPORTANT: API Key is read from environment variable set in .env
GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")

# --- FastAPI Router Setup ---
router = APIRouter()

# --- Pydantic Schemas for Request and Response ---

class RecipeUrl(BaseModel):
    """Schema for the incoming request body."""
    url: str = Field(..., description="The URL of the recipe page to analyse.")

class RecipeData(BaseModel):
    """Schema for the structured JSON response from the LLM."""
    url: str = Field(..., description="Original source URL.")
    title: str = Field(..., description="The title of the recipe.")
    description: str = Field(..., description="The description of the recipe.")
    servings: int = Field(None, description="The number of servings (e.g., 6).")
    prep_time: int = Field(None, description="The preparation time (e.g., 15).")
    cook_time: int = Field(None, description="The cooking time (e.g., 120).")
    ingredients: List[str] = Field(..., description="A list of ingredients, with quantities.")
    instructions: List[str] = Field(..., description="A list of numbered instruction steps, one sentence per list item")
    notes: str = Field(None, description="Any additional notes or tips.")
    source: str = Field(None, description="Which site / chef the recipe should be attributed to")
    category: str = Field(None, description="The most relevant category for this recipe, based on the prompt options")
    imageUrl: str = Field(None, description="The image url for the recipe image")


# ----------------------------------------------------------------------
# DEPENDENCY INJECTION FUNCTION
# Uses the high-level Client to avoid internal API conflicts.
# ----------------------------------------------------------------------

async def get_gemini_client():
    """Dependency injector that creates and yields a properly initialized Client."""
    
    # 1. Check for key availability
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini AI Service is unavailable. GOOGLE_GEMINI_API_KEY is not configured."
        )
    
    try:
        # 2. Initialize the standard Client with the API key explicitly.
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # 3. Yield the client for use in the endpoint function
        yield client
        
    except Exception as e:
        logger.error(f"FATAL: Gemini Client Setup Failed. Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize AI Client.")
        
    # No manual 'finally' block needed for the high-level client in this context
    # as it manages its own connection pool.


# --- API Endpoint ---

@router.post("/analyse", response_model=RecipeData)
async def analyse_recipe(
    recipe_url: RecipeUrl,
    # Inject the client dependency here
    client: genai.Client = Depends(get_gemini_client) 
):
    """
    Analyses a recipe URL using the Gemini API and returns structured recipe data.
    """
    logger.info(f"API call: POST /api/recipe/analyse for URL: {recipe_url.url}")
    
    # Define the instruction prompt for the model
    system_prompt = (
        "You are a professional recipe extraction engine. "
        "Your task is to visit the provided URL, read the recipe details, and extract "
        "the recipe information into a clean, structured JSON object that strictly adheres "
        "to the provided JSON schema. Ensure the instructions and ingredients are in lists. "
        "If a field (like servings or cook_time) is not found, return an empty string or null."
        "All timings (prep + cook) must be converted into minutes and only return the integer value"
        "All instructions must be split so that each sentence is one instruction"
        "Recipe images for these domains typically look something like;"
        "- For Tesco -> realfood.tesco.com/media/images/"
        "- For Waitrose -> /waitrose-prod.scene7.com/is/image/waitroseprod/ with a uuid query parameter"
        "Go through all urls in the code and extract out the most suitable / appropriate image URL, including all query parameters"
        "If the domain is waitrose.com, make the Source property `Waitrose`"
        "If the domain is tesco.com make the Source property `Tesco`.  Recipe data can be extracted from the <script type='application/ld+json'> script."
        "If multipe images are available, the selectied one must be the highest quality available"
        "Do not make anything up.  Only include real data that has been extracted, especially image URLs.  Validate the URL gives a 200.  If not find another suitable image."
        "Automatically associate the recipe to a category, but only one from the following (choose the most appropriate);"
        "Bread, Christmas, Drinks, Easter, Fish, Halloween, Ice Cream, Light Bites, Meat (Poultry), Meat (Red), Puddings, Sandwiches, Side Dishes, Vegetarian"
    )

    try:
        # Create the configuration for structured JSON output
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=RecipeData,
        )
        
        # Define the user query (instructing the model to act on the URL)
        user_query = f"Extract the recipe from this URL: {recipe_url.url}"

        # Use the async method on the models property
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_query,
            config=config,
        )

        # The response text will be a JSON string adhering to the RecipeData schema
        if not response.text:
            raise ValueError("AI returned an empty response. Could not extract recipe from the source.")
        
        # --- DEBUG LOGGING START ---
        logger.critical("--- RAW AI RESPONSE START ---")
        logger.critical(response.text)
        logger.critical("--- RAW AI RESPONSE END ---")
        # --- DEBUG LOGGING END ---
        
        # Parse the JSON string into the Pydantic model for validation and return
        recipe_data = RecipeData.model_validate_json(response.text)
        recipe_data.url = recipe_url.url # Ensure the original URL is retained

        logger.info(f"Successfully extracted recipe: {recipe_data.title}")
        return recipe_data

    except Exception as e:
        logger.error(f"Internal processing error during recipe analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: Failed to process AI response. {str(e)}"
        )