"""
Whisk Recipe Creation Module

Handles creation of recipes in Samsung Food (Whisk) API with support for
ingredient and instruction groups, and recipe source attribution.
"""

import requests
import logging
from urllib.parse import urlparse, urlunparse
from .whisk_collections import get_collection_id_for_recipe, get_collection_names_for_recipe

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Whisk API endpoint for creating recipes
RECIPES_API_URL = "https://graph.whisk.com/v1/recipes"

def create_recipe_in_whisk(access_token: str, scraped_data: dict) -> dict:
    """
    Create a recipe in Samsung Food (Whisk) using scraped data.
    
    Args:
        access_token: Valid Whisk API access token
        scraped_data: Dictionary with scraped recipe data
        
    Returns:
        Dictionary with Whisk API response including recipe ID
        
    Raises:
        Exception with error_info attribute if creation fails
    """
    
    logger.info(f"Creating recipe: {scraped_data['name']}")
    
    # Transform ingredients to Whisk format (with optional groups)
    ingredients_list = []
    for ing in scraped_data['ingredients']:
        ing_dict = {"text": ing['text']}
        # Only add group attribute if the ingredient has one
        if ing.get('group'):
            ing_dict["group"] = ing['group']
        ingredients_list.append(ing_dict)
    
    # Transform instructions to Whisk format (no group attribute for regular steps)
    instructions_list = [
        {"text": instruction, "customLabels": []}
        for instruction in scraped_data['instructions']
    ]
    
    # If there's a cook's tip, add as additional instruction steps with group="Cook's tip"
    if scraped_data.get('cooks_tip'):
        # Handle both list (new format) and string (old format)
        tips = scraped_data['cooks_tip']
        if isinstance(tips, str):
            # Old format - split by double newlines
            tips = [t.strip() for t in tips.split('\n\n') if t.strip()]
        
        # Add each tip as a separate step
        for tip in tips:
            if tip:
                instructions_list.append({
                    "text": tip,
                    "group": "Cook's tip",
                    "customLabels": []
                })
    
    # Build durations object (times in minutes)
    durations = {}
    if scraped_data.get('prep_time') is not None:
        durations['prepTime'] = int(scraped_data['prep_time'])
    if scraped_data.get('cook_time') is not None:
        durations['cookTime'] = int(scraped_data['cook_time'])
    if scraped_data.get('total_time') is not None:
        durations['totalTime'] = int(scraped_data['total_time'])
    
    # Build images array
    images = []
    if scraped_data.get('image_url'):
        images.append({"url": scraped_data['image_url']})
    
    # Ensure servings is an integer
    servings = scraped_data.get('servings', 1)
    try:
        servings = int(servings)
    except (ValueError, TypeError):
        servings = 1
    
    # Build source object (author + URL without query strings)
    source = None
    if scraped_data.get('source_url'):
        # Parse URL and remove query string
        parsed = urlparse(scraped_data['source_url'])
        clean_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
        source = {
            "name": "Waitrose",
            "displayName": "Waitrose",
            "sourceRecipeUrl": clean_url
        }
    
    # Determine which collection(s) this recipe belongs to
    collection_ids = get_collection_id_for_recipe(scraped_data['name'])
    collection_names = get_collection_names_for_recipe(scraped_data['name'])

    if collection_ids:
        logger.info(f"Auto-assigned to {len(collection_ids)} collection(s): {', '.join(collection_names)}")
    else:
        # Default to Vegetarian collection if no match found
        from .whisk_collections import COLLECTIONS
        collection_ids = [COLLECTIONS["vegetarian"]]
        logger.info("Auto-assigned to 0 collections - defaulting to Vegetarian")

    # Build the recipe payload for Whisk API
    recipe_payload = {
        "payload": {
            "name": scraped_data['name'],
            "description": scraped_data.get('description', ''),
            "servings": servings,
            "language": "en-GB",
            "durations": durations,
            "ingredients": ingredients_list,
            "instructions": {"steps": instructions_list},
            "images": images,
        },
        "collectionIds": collection_ids
    }
      
    # Add source if available
    if source:
        recipe_payload["payload"]["source"] = source
    
    # Make API request
    headers = {
        "Authorization": f"Token {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    response = requests.post(RECIPES_API_URL, headers=headers, json=recipe_payload)
    
    # Handle errors
    try:
        response.raise_for_status()
    except requests.HTTPError as e:
        error_body = None
        try:
            error_body = response.json()
        except:
            error_body = {"raw_text": response.text}
        
        error_info = {
            "message": f"{response.status_code} {response.reason}",
            "body": error_body
        }
        logger.error(f"Failed to create recipe: {error_info['message']}")
        e.error_info = error_info
        raise e
    
    logger.info("✅ Recipe created successfully")
    return response.json()