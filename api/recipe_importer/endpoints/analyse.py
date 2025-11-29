import logging
import os 
import re 
import httpx 
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List
from itertools import groupby
from ..scripts.schemas import RecipeSchema as RecipeData, RecipeItem
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

def process_instructions(instructions: List[RecipeItem]) -> List[RecipeItem]:
    """
    Joins fragmented lines and re-splits them into proper sentences,
    preserving groups.
    """
    if not instructions:
        return []
    
    processed_list = []
    for group_name, items in groupby(instructions, key=lambda x: x.group):
        group_texts = [item.text for item in items]
        full_text = " ".join(group_texts)
        full_text = re.sub(r'\s+', ' ', full_text).strip()
        sentences = re.split(r'(?<=[.!?])\s+', full_text)
        
        for s in sentences:
            if s.strip():
                processed_list.append(RecipeItem(text=s.strip(), group=group_name))
                
    return processed_list

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
        "- Clean the recipe title so only the first word is capitalised (unless the word is clearly meant to be capitalised) and there are no trailing spaces.\n"
        "- GROUPING: Detect ingredient/instruction groups (e.g. 'For the Icing').\n"
        "  - If a group exists, set the 'group' field to the group name (e.g. 'For the icing').\n"
        "  - If the group name is a single word (e.g. 'Icing'), prefix it with 'For the ' (e.g. 'For the icing').\n"
        "  - Ensure the group name starts with a capital letter (e.g. 'For the icing').  Everything else is lowercase\n"
        "  - For the main section, set 'group' to null.\n"
        "- INSTRUCTIONS: Include 'Cook's Tips' or similar notes as instructions with group='Cook's tip'.\n"
        "- INGREDIENTS: For each ingredient, strip out any blank spaces between a quantity (integer) and its unit of measurement. E.g. '150 g' must be '150g'. \n"
        "  - However, this does not apply to measurements like tbsp or tsp \n"
        "- IMAGES: \n"
        "  - Check 'srcset' attributes in the HTML for the highest resolution version. \n"
        "  - Always PRESERVE all query parameters (e.g. '?uuid=...&wid=...') exactly as found. \n"
        "  - Do not truncate URLs at '&' symbols.\n",
        "  - Preserve the entire URL for Scene7 hosted images (the $ character and all proceeding characters are very important) \n"
        "    - An example URL is https://waitrose-prod.scene7.com/is/image/waitroseprod/hazelnut-chocolate-layer-cake?uuid=34b60a96-daee-43ee-a61e-8b1cf6637b61&$Waitrose-Default-Image-Preset$&wid=2400&fit=constrain%2C0 \n"
        "- CATEGORY: Automatically associate the recipe to ONE of the following categories: \n"
        "  - Bread, Christmas, Drinks, Easter, Fish, Halloween, Ice Cream, Light Bites, Meat (Poultry), Meat (Red), Puddings, Sandwiches, Side Dishes, Vegetarian.\n"
        "- SOURCE: Always populate the source based on the domain of the URL being processed.  E.g. waitrose.com is 'Waitrose'"
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
        if recipe_data.ingredients:
            cleaned_ingredients = []
            for item in recipe_data.ingredients:
                cleaned_text = clean_ingredient(item.text)
                if cleaned_text:
                    item.text = cleaned_text
                    cleaned_ingredients.append(item)
            recipe_data.ingredients = cleaned_ingredients

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