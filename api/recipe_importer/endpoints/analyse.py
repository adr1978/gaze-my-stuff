import logging
import os 
import re 
import httpx 
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List
from ..scripts.schemas import RecipeSchema as RecipeData

# --- NEW IMPORT ---
from ..scripts.ingredient_cleaner import clean_ingredient

# Import Google GenAI SDK components
from google import genai
from google.genai import types 

# --- Configuration & Logging Setup ---
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("google.genai").setLevel(logging.WARNING)

logger = logging.getLogger("recipe_importer")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('INFO:     [Recipe Importer] %(message)s'))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")

router = APIRouter()

class RecipeUrl(BaseModel):
    url: str = Field(..., description="The URL of the recipe page to analyse.")

async def get_gemini_client():
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API Key missing.")
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        yield client
    except Exception as e:
        logger.error(f"Gemini Client Setup Failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize AI Client.")

# --- Helper Functions ---

def process_instructions(instructions: List[str]) -> List[str]:
    """
    Joins fragmented lines and re-splits them into proper sentences.
    """
    if not instructions:
        return []
    
    full_text = " ".join(instructions)
    
    # Simple regex to collapse whitespace for instructions logic
    full_text = re.sub(r'\s+', ' ', full_text).strip()
    
    # Split by sentence endings
    sentences = re.split(r'(?<=[.!?])\s+', full_text)
    
    return [s.strip() for s in sentences if s.strip()]

# --- API Endpoint ---

@router.post("/analyse", response_model=RecipeData)
async def analyse_recipe(
    recipe_url: RecipeUrl,
    client: genai.Client = Depends(get_gemini_client) 
):
    logger.info(f"Analyzing URL: {recipe_url.url}")
    
    # --- STEP 1: SCRAPE ---
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as web_client:
            web_response = await web_client.get(recipe_url.url, headers=headers)
            web_response.raise_for_status()
            raw_html = web_response.text

    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Could not fetch content. The site may be blocking access. Error: {str(e)}"
        )

    # --- STEP 2: CLEAN HTML ---
    try:
        soup = BeautifulSoup(raw_html, 'html.parser')
        
        for tag in soup(["style", "svg", "noscript", "iframe", "header", "footer", "nav"]):
            tag.decompose()
        for script in soup.find_all("script"):
            if script.get("type") != "application/ld+json":
                script.decompose()

        cleaned_content = str(soup)[:100000] 
    except Exception as e:
        logger.error(f"HTML cleaning failed: {e}")
        raise HTTPException(status_code=500, detail="Error processing HTML content.")

    # --- STEP 3: AI EXTRACTION ---
    system_prompt = (
        "You are a professional recipe extraction engine. "
        "Analyze the HTML content (including JSON-LD) to extract recipe data.\n"
        "RULES:\n"
        "- Return ONLY valid JSON matching the schema.\n"
        "- Convert all timings to integer minutes.\n"
        "- Split instructions into individual steps.\n"
        "- If a field is missing, return null.\n"
        "- For images: prioritize high-res URLs from JSON-LD or meta tags.\n"
        "- CATEGORY: Automatically associate the recipe to ONE of the following categories: "
        "Bread, Christmas, Drinks, Easter, Fish, Halloween, Ice Cream, Light Bites, "
        "Meat (Poultry), Meat (Red), Puddings, Sandwiches, Side Dishes, Vegetarian."
    )

    try:
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=RecipeData,
        )
        
        user_query = f"Extract recipe data from this HTML:\n\n{cleaned_content}"

        response = await client.aio.models.generate_content(
            model='gemini-2.0-flash', 
            contents=user_query,
            config=config,
        )

        if not response.text:
            raise ValueError("Empty response from AI model.")
        
        recipe_data = RecipeData.model_validate_json(response.text)
        recipe_data.url = recipe_url.url

        # --- STEP 4: POST-PROCESSING (Text Cleanup) ---
        
        # Clean Ingredients using shared logic (strips brands, fixes units)
        if recipe_data.ingredients:
            recipe_data.ingredients = [
                clean_ingredient(ing) 
                for ing in recipe_data.ingredients 
                if ing
            ]

        # Re-format Instructions
        if recipe_data.instructions:
            recipe_data.instructions = process_instructions(recipe_data.instructions)

        logger.info(f"Successfully extracted: {recipe_data.title}")
        return recipe_data

    except Exception as e:
        logger.error(f"AI Extraction failed: {e}")
        if 'response' in locals() and response.text:
            logger.error(f"Failed JSON: {response.text[:200]}...")
            
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process recipe data: {str(e)}"
        )