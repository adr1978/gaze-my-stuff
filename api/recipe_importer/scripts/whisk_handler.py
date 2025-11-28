"""
Whisk Handler Script
Orchestrates the authentication and upload process.
"""
import logging
import os
import json
from .whisk_auth import get_access_token
from .whisk_create import create_recipe_in_whisk

# Use the shared logger
logger = logging.getLogger("whisk_importer")

def upload_recipe_to_whisk(recipe_data: dict):
    """
    Main entry point for uploading a recipe.
    """
    try:
        # STEP 1: AUTHENTICATION
        logger.info("Step 1: Authenticating with Samsung Food...")
        token_data = get_access_token()
        
        if not token_data or not token_data.get('access_token'):
            return 401, {"error": "Authentication failed"}
            
        access_token = token_data['access_token']
        # Log the source (Stored vs New) as requested
        auth_source = token_data.get('source', 'unknown')
        logger.info(f"  -> ✅ Auth successful (Source: {auth_source})")
        
        # STEP 2: UPLOAD
        logger.info("Step 2: Uploading recipe data...")
        whisk_response = create_recipe_in_whisk(access_token, recipe_data)
        
        # Success
        logger.info("  -> ✅ Upload complete!")
        return 200, {
            "status": "success", 
            "whisk_id": whisk_response.get('recipe', {}).get('id'),
            "recipe": recipe_data.get('name')
        }

    except Exception as e:
        # If it's a requests error with attached info
        if hasattr(e, 'error_info'):
            return 500, {"error": e.error_info}
            
        logger.error(f"Upload process failed: {str(e)}")
        return 500, {"error": str(e)}