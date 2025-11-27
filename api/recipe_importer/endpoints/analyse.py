import logging
import os 
import re 
import httpx 
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List
from ..scripts.schemas import RecipeSchema as RecipeData

# Import Google GenAI SDK components
from google import genai
from google.genai import types 

# --- Configuration & Logging Setup ---

# 1. Suppress noisy third-party logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("google.genai").setLevel(logging.WARNING)

# 2. Configure our app logger
logger = logging.getLogger("recipe_importer")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('INFO:     [Recipe Importer] %(message)s'))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

# IMPORTANT: API Key is read from environment variable
GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")

# --- FastAPI Router Setup ---
router = APIRouter()

# --- Pydantic Schemas ---
class RecipeUrl(BaseModel):
    """Schema for the incoming request body."""
    url: str = Field(..., description="The URL of the recipe page to analyse.")

# --- Dependency Injection ---
async def get_gemini_client():
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API Key missing.")
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        yield client
    except Exception as e:
        logger.error(f"Gemini Client Setup Failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize AI Client.")

# --- Helper Functions for Text Cleaning ---

def clean_whitespace(text: str) -> str:
    """Collapses newlines, tabs, and multiple spaces into a single space."""
    if not text:
        return ""
    # Replace newlines and tabs with space
    text = re.sub(r'[\n\r\t]+', ' ', text)
    # Collapse multiple spaces into one
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def process_instructions(instructions: List[str]) -> List[str]:
    """
    Joins fragmented lines and re-splits them into proper sentences.
    Example: ["Line", "2 trays."] -> ["Line 2 trays."]
    """
    if not instructions:
        return []
    
    # 1. Join everything into one text block to handle fragmented lines from HTML
    full_text = " ".join(instructions)
    
    # 2. Clean whitespace (removes the newlines that caused the fragmentation)
    full_text = clean_whitespace(full_text)
    
    # 3. Split by sentence endings (. ! ?) followed by whitespace
    sentences = re.split(r'(?<=[.!?])\s+', full_text)
    
    # 4. Filter empty strings and return
    return [s.strip() for s in sentences if s.strip()]

# --- API Endpoint ---

@router.post("/analyse", response_model=RecipeData)
async def analyse_recipe(
    recipe_url: RecipeUrl,
    client: genai.Client = Depends(get_gemini_client) 
):
    logger.info(f"Analyzing URL: {recipe_url.url}")
    
    # --- STEP 1: SCRAPE (Using httpx with SPECIFIC headers) ---
    try:
        # We use the EXACT User-Agent from your working waitrose_scraper.py
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
        
        # Remove noise
        for tag in soup(["style", "svg", "noscript", "iframe", "header", "footer", "nav"]):
            tag.decompose()
        # Keep JSON-LD, remove other scripts
        for script in soup.find_all("script"):
            if script.get("type") != "application/ld+json":
                script.decompose()

        cleaned_content = str(soup)[:100000] 
    except Exception as e:
        logger.error(f"HTML cleaning failed: {e}")
        raise HTTPException(status_code=500, detail="Error processing HTML content.")

    # --- STEP 3: AI EXTRACTION ---
    
    # UPDATED: Category rule is now explicit in the main RULES list
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
        
        # Validate JSON Structure
        recipe_data = RecipeData.model_validate_json(response.text)
        recipe_data.url = recipe_url.url

        # --- STEP 4: POST-PROCESSING (Text Cleanup) ---
        
        # Clean Ingredients (remove extra spaces)
        if recipe_data.ingredients:
            recipe_data.ingredients = [
                clean_whitespace(ing) 
                for ing in recipe_data.ingredients 
                if ing
            ]

        # Re-format Instructions (single line per sentence)
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