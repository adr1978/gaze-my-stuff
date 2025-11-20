"""
Whisk Upload Handler

Orchestrates the Whisk upload workflow: authenticate → transform data → upload to Whisk
Used by the upload endpoint to process frontend recipe data.
"""

import logging
from .whisk_auth import authenticate
from .whisk_create import create_recipe_in_whisk
from .whisk_collections import get_collection_id_for_recipe, get_collection_names_for_recipe

logger = logging.getLogger(__name__)


def upload_recipe_to_whisk(recipe_data: dict):
    """
    Upload a recipe to Samsung Food (Whisk) from frontend JSON format.
    
    This function:
    1. Authenticates with Whisk API
    2. Transforms frontend JSON to Whisk format
    3. Uploads the recipe
    
    Args:
        recipe_data: Dictionary with recipe data in frontend format
        
    Returns:
        Tuple of (status_code, response_dict)
    """
    
    # Validate required fields
    if not recipe_data.get('title'):
        return 400, {
            "success": False,
            "steps": {},
            "data": None,
            "error": {"message": "Recipe title is required", "body": {}}
        }
    
    steps = {}
    
    # Step 1: Authenticate with Whisk
    try:
        logger.info("Step 1: Authenticating with Whisk...")
        access_token, token_source = authenticate()
        steps["authentication"] = f"✅ Authenticated ({token_source})"
        logger.info(f"✅ Authentication successful ({token_source})")
    except Exception as e:
        logger.error(f"❌ Authentication failed: {str(e)}")
        error_info = e.error_info if hasattr(e, 'error_info') else {
            "message": "Authentication failed",
            "body": {"details": str(e)}
        }
        return 500, {"success": False, "steps": steps, "data": None, "error": error_info}
    
    # Step 2: Transform frontend JSON to Whisk format
    try:
        logger.info("Step 2: Transforming recipe data to Whisk format...")
        whisk_recipe = transform_to_whisk_format(recipe_data)
        steps["transformation"] = "✅ Data transformed"
        logger.info("✅ Data transformation successful")
    except Exception as e:
        logger.error(f"❌ Data transformation failed: {str(e)}")
        return 500, {
            "success": False,
            "steps": steps,
            "data": None,
            "error": {"message": "Data transformation failed", "body": {"details": str(e)}}
        }
    
    # Step 3: Upload to Whisk
    try:
        logger.info("Step 3: Uploading recipe to Whisk...")
        whisk_response = create_recipe_in_whisk(access_token, whisk_recipe)
        steps["whisk_upload"] = "✅ Uploaded to Samsung Food"
        logger.info("✅ Upload to Whisk successful")
    except Exception as e:
        logger.error(f"❌ Whisk upload failed: {str(e)}")
        error_info = e.error_info if hasattr(e, 'error_info') else {
            "message": "Upload failed",
            "body": {"details": str(e)}
        }
        return 500, {"success": False, "steps": steps, "data": None, "error": error_info}
    
    logger.info(f"✅ Recipe '{recipe_data['title']}' successfully uploaded to Whisk")
    return 200, {
        "success": True,
        "steps": steps,
        "data": {"whisk_response": whisk_response},
        "error": None
    }


def transform_to_whisk_format(frontend_data: dict) -> dict:
    """
    Transform frontend recipe JSON format to Whisk-compatible format.
    
    Frontend format:
    {
        "title": "Recipe Name",
        "description": "...",
        "servings": 4,
        "prep_time": 15,
        "cook_time": 30,
        "ingredients": ["ingredient 1", "ingredient 2"],
        "instructions": ["step 1", "step 2"],
        "notes": "...",
        "source": "...",
        "category": "Fish",
        "imageUrl": "...",
        "url": "..."
    }
    
    Whisk format:
    {
        "name": "Recipe Name",
        "description": "...",
        "servings": 4,
        "prep_time": 15,
        "cook_time": 30,
        "total_time": 45,
        "ingredients": [{"text": "ingredient 1"}, {"text": "ingredient 2"}],
        "instructions": ["step 1", "step 2"],
        "cooks_tip": "...",
        "source_url": "...",
        "image_url": "..."
    }
    
    Args:
        frontend_data: Recipe data in frontend format
        
    Returns:
        Dictionary in Whisk-compatible format
    """
    
    logger.info(f"Transforming recipe: {frontend_data.get('title')}")
    
    # Map title -> name
    whisk_data = {
        "name": frontend_data.get("title", ""),
        "description": frontend_data.get("description", ""),
        "servings": frontend_data.get("servings"),
        "prep_time": frontend_data.get("prep_time"),
        "cook_time": frontend_data.get("cook_time"),
    }
    
    # Calculate total_time
    prep = frontend_data.get("prep_time") or 0
    cook = frontend_data.get("cook_time") or 0
    whisk_data["total_time"] = prep + cook if (prep or cook) else None
    
    # Transform ingredients: list of strings → list of dicts with "text" key
    # Frontend ingredients can be simple strings or already in dict format
    ingredients = frontend_data.get("ingredients", [])
    whisk_data["ingredients"] = []
    for ing in ingredients:
        if isinstance(ing, str):
            whisk_data["ingredients"].append({"text": ing})
        elif isinstance(ing, dict) and "text" in ing:
            # Already in correct format (from Waitrose parser)
            whisk_data["ingredients"].append(ing)
        else:
            logger.warning(f"Skipping invalid ingredient format: {ing}")
    
    # Instructions stay as list of strings
    whisk_data["instructions"] = frontend_data.get("instructions", [])
    
    # Map notes → cooks_tip (if present)
    if frontend_data.get("notes"):
        whisk_data["cooks_tip"] = frontend_data["notes"]
    
    # Map url → source_url
    if frontend_data.get("url"):
        whisk_data["source_url"] = frontend_data["url"]
    
    # Map imageUrl → image_url
    if frontend_data.get("imageUrl"):
        whisk_data["image_url"] = frontend_data["imageUrl"]
    
    logger.info(f"✅ Transformation complete for recipe: {whisk_data['name']}")
    return whisk_data
