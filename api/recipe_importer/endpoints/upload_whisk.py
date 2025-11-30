"""
Whisk Recipe Upload Endpoint

Handles POST requests to upload recipe data to Samsung Food (Whisk).
Accepts recipe data from frontend, transforms it, and uploads to Whisk.
THEN saves to Notion as a backup (if enabled).

Endpoint: POST /api/recipe/upload-whisk
"""

import logging
import json
from fastapi import APIRouter, HTTPException
from ..scripts.recipe_schemas import RecipeSchema as RecipeUpload

# Import handlers
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.whisk_handler import upload_recipe_to_whisk
from scripts.recipe_notion_adapter import save_recipe_to_notion

# Import Config
# We need to go up two levels to get to api/notion_handlers
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from notion_handlers.notion_config import WHISK_SAVE_TO_NOTION

# Configure logging
logger = logging.getLogger("uvicorn.error")

# Create FastAPI router
router = APIRouter()


# --- API Endpoint ---
@router.post("/upload-whisk")
async def upload_whisk(recipe: RecipeUpload):
    """
    Upload a recipe to Samsung Food (Whisk).
    If WHISK_SAVE_TO_NOTION is true, also saves to Notion.
    """
    logger.info(f"API call: POST /upload-whisk for: {recipe.title}")
    
    try:
        # 1. Convert Pydantic model to dict
        recipe_data = recipe.model_dump()
        whisk_data = recipe_data.copy()
        whisk_data['name'] = recipe_data['title'] 
        
        # 2. Upload to Whisk
        status_code, response_data = upload_recipe_to_whisk(whisk_data)
        
        if status_code != 200:
            logger.error(f"Whisk Upload failed: {response_data}")
            raise HTTPException(status_code=status_code, detail=response_data)
        
        # 3. Extract Whisk ID (Fixed Logic)
        whisk_id = "unknown"
        if isinstance(response_data, dict):
            # First try the direct key provided by your handler
            whisk_id = response_data.get("whisk_id")
            # Fallback for safety
            if not whisk_id:
                 whisk_id = response_data.get("recipe", {}).get("id", "unknown")
        else:
            logger.warning(f"⚠️ Whisk response was not a dictionary (Type: {type(response_data)})...")        

        # 4. Save to Notion (Conditional)
        if WHISK_SAVE_TO_NOTION:
            logger.info("[Recipe Importer] Step 3: Saving to Notion...")
            try:
                if whisk_id != "unknown":
                    save_recipe_to_notion(recipe_data, whisk_id)
                    logger.info("[Recipe Importer]   -> ✅ Notion save complete!")
                else:
                    logger.warning("  -> Skipping Notion save: Could not retrieve Whisk ID from response")
            except Exception as e:
                # Log error with traceback context but don't fail request
                logger.error(f"❌ Failed to save to Notion: {str(e)}")
                logger.debug(f"Recipe Data Dump: {json.dumps(recipe_data, default=str)[:200]}...")
        else:
            logger.info("Skipping Notion save (Feature disabled via env)")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in upload_whisk: {str(e)}")
        # Re-raise as 500
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")