"""
Whisk Recipe Upload Endpoint

Handles POST requests to upload recipe data to Samsung Food (Whisk).
Accepts recipe data from frontend, transforms it, and uploads to Whisk.

Endpoint: POST /api/recipe/upload-whisk
Request body: Recipe data in frontend JSON format
Response: Success/failure status with Whisk API response
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from ..scripts.schemas import RecipeSchema as RecipeUpload

# Import the whisk handler script
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.whisk_handler import upload_recipe_to_whisk

# Configure logging
logger = logging.getLogger("uvicorn.error")

# Create FastAPI router
router = APIRouter()


# --- API Endpoint ---
@router.post("/upload-whisk")
async def upload_whisk(recipe: RecipeUpload):
    """
    Upload a recipe to Samsung Food (Whisk).
    
    This endpoint:
    1. Receives recipe data from frontend
    2. Authenticates with Whisk API
    3. Transforms data to Whisk format
    4. Uploads the recipe
    5. Returns success/failure status
    
    Args:
        recipe: RecipeUpload containing all recipe data
        
    Returns:
        JSON response with upload status and Whisk API response
    """
    logger.info(f"API call: POST /upload-whisk for: {recipe.title}")
    
    try:
        recipe_data = recipe.model_dump()
        
        # We assume recipe_data matches what whisk_handler needs (RecipeSchema)
        # Note: whisk_create expects 'name' but schema has 'title'.
        # We map it here to be safe.
        whisk_data = recipe_data.copy()
        whisk_data['name'] = recipe_data['title'] 
        
        status_code, response_data = upload_recipe_to_whisk(whisk_data)
        
        if status_code != 200:
            logger.error(f"Upload failed: {response_data}")
            raise HTTPException(status_code=status_code, detail=response_data)
        
        # Single success message
        #logger.info(f"✅ Workflow complete for '{recipe.title}'")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
