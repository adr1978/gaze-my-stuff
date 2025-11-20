"""
Waitrose Recipe Parser Endpoint

Handles POST requests to parse Waitrose recipe URLs.
Returns structured recipe data to frontend without uploading to Whisk.

Endpoint: POST /api/recipe/parse-waitrose
Request body: {"url": "https://www.waitrose.com/..."}
Response: Recipe data in frontend JSON format
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Import the waitrose handler script
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.waitrose_handler import process_waitrose_recipe

# Configure logging
logger = logging.getLogger("uvicorn.error")

# Create FastAPI router
router = APIRouter()


# --- Pydantic Request Schema ---

class WaitroseUrl(BaseModel):
    """Schema for the incoming request body."""
    url: str = Field(..., description="The Waitrose recipe URL to parse.")


# --- API Endpoint ---

@router.post("/parse-waitrose")
async def parse_waitrose(request: WaitroseUrl):
    """
    Parse a Waitrose recipe URL and return structured recipe data.
    
    This endpoint:
    1. Validates the Waitrose URL
    2. Scrapes the recipe page
    3. Extracts and cleans recipe data
    4. Returns structured JSON to frontend
    
    Does NOT upload to Whisk - that is handled by the separate upload endpoint.
    
    Args:
        request: WaitroseUrl containing the recipe URL
        
    Returns:
        JSON response with recipe data or error details
    """
    logger.info(f"API call: POST /api/recipe/parse-waitrose for URL: {request.url}")
    
    try:
        # Process the Waitrose URL (parse only, no upload)
        status_code, response_data = process_waitrose_recipe(request.url)
        
        # If processing failed, raise HTTP exception
        if status_code != 200:
            logger.error(f"Parsing failed with status {status_code}")
            raise HTTPException(
                status_code=status_code,
                detail=response_data.get("error", {})
            )
        
        logger.info(f"✅ Successfully parsed recipe: {response_data['data'].get('title')}")
        return response_data
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Unexpected error during Waitrose parsing: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during recipe parsing",
                "body": {"details": str(e)}
            }
        )
