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

# Import the whisk handler script
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.whisk_handler import upload_recipe_to_whisk

# Configure logging
logger = logging.getLogger("uvicorn.error")

# Create FastAPI router
router = APIRouter()


# --- Pydantic Request Schema ---

class RecipeUpload(BaseModel):
    """
    Schema for recipe upload request body.
    This matches the frontend JSON format.
    """
    title: str = Field(..., description="Recipe title")
    description: Optional[str] = Field(None, description="Recipe description")
    servings: Optional[int] = Field(None, description="Number of servings")
    prep_time: Optional[int] = Field(None, description="Prep time in minutes")
    cook_time: Optional[int] = Field(None, description="Cook time in minutes")
    ingredients: List[str] = Field(..., description="List of ingredients")
    instructions: List[str] = Field(..., description="List of instruction steps")
    notes: Optional[str] = Field(None, description="Additional notes or cook's tips")
    source: Optional[str] = Field(None, description="Recipe source attribution")
    category: Optional[str] = Field(None, description="Recipe category")
    imageUrl: Optional[str] = Field(None, description="Recipe image URL")
    url: Optional[str] = Field(None, description="Original source URL")


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
    logger.info(f"API call: POST /api/recipe/upload-whisk for recipe: {recipe.title}")
    
    try:
        # Convert Pydantic model to dict for processing
        recipe_data = recipe.model_dump()
        
        logger.info("Starting Whisk upload workflow...")
        logger.info(f"Recipe: {recipe_data.get('title')}")
        logger.info(f"Servings: {recipe_data.get('servings')}")
        logger.info(f"Ingredients count: {len(recipe_data.get('ingredients', []))}")
        logger.info(f"Instructions count: {len(recipe_data.get('instructions', []))}")
        
        # Process upload workflow (auth → transform → upload)
        status_code, response_data = upload_recipe_to_whisk(recipe_data)
        
        # If upload failed, raise HTTP exception
        if status_code != 200:
            logger.error(f"❌ Upload failed with status {status_code}")
            logger.error(f"Error details: {response_data.get('error')}")
            raise HTTPException(
                status_code=status_code,
                detail=response_data.get("error", {})
            )
        
        logger.info(f"✅ Successfully uploaded recipe '{recipe.title}' to Whisk")
        logger.info(f"Workflow steps: {response_data.get('steps')}")
        return response_data
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"❌ Unexpected error during Whisk upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during recipe upload",
                "body": {"details": str(e)}
            }
        )
