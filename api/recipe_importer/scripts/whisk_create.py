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

def create_recipe_in_whisk(access_token: str, recipe_data: dict) -> dict:
    """
    Create a recipe in Samsung Food (Whisk) using recipe data.
    
    This function accepts data in Whisk-compatible format (from whisk_handler transformation).
    
    Args:
        access_token: Valid Whisk API access token
        recipe_data: Dictionary with recipe data in Whisk format:
            - name: Recipe title
            - description: Recipe description
            - servings: Number of servings (integer)
            - prep_time: Prep time in minutes
            - cook_time: Cook time in minutes
            - total_time: Total time in minutes
            - ingredients: List of dicts with "text" key (and optional "group")
            - instructions: List of instruction strings
            - cooks_tip: Cook's tip text (optional)
            - source_url: Original URL (optional)
            - image_url: Recipe image URL (optional)
        
    Returns:
        Dictionary with Whisk API response including recipe ID
        
    Raises:
        Exception with error_info attribute if creation fails
    """
    
    logger.info(f"Creating recipe: {recipe_data['name']}")
    
    # Transform ingredients to Whisk format (with optional groups)
    # Input: list of dicts like [{"text": "ingredient"}, {"text": "ing2", "group": "For sauce"}]
    ingredients_list = []
    for ing in recipe_data['ingredients']:
        ing_dict = {"text": ing['text']}
        # Only add group attribute if the ingredient has one
        if ing.get('group'):
            ing_dict["group"] = ing['group']
        ingredients_list.append(ing_dict)
    
    # Transform instructions to Whisk format (no group attribute for regular steps)
    instructions_list = [
        {"text": instruction, "customLabels": []}
        for instruction in recipe_data['instructions']
    ]
    
    # If there's a cook's tip, add as additional instruction steps with group="Cook's tip"
    if recipe_data.get('cooks_tip'):
        # Handle both list (new format) and string (old format)
        tips = recipe_data['cooks_tip']
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
    if recipe_data.get('prep_time') is not None:
        durations['prepTime'] = int(recipe_data['prep_time'])
    if recipe_data.get('cook_time') is not None:
        durations['cookTime'] = int(recipe_data['cook_time'])
    if recipe_data.get('total_time') is not None:
        durations['totalTime'] = int(recipe_data['total_time'])
    
    # Build images array
    images = []
    if recipe_data.get('image_url'):
        images.append({"url": recipe_data['image_url']})
    
    # Ensure servings is an integer
    servings = recipe_data.get('servings', 1)
    try:
        servings = int(servings)
    except (ValueError, TypeError):
        servings = 1
    
    # Build source object (author + URL without query strings)
    source = None
    if recipe_data.get('source_url'):
        # Parse URL and remove query string
        parsed = urlparse(recipe_data['source_url'])
        clean_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
        
        # Determine source name from URL or use provided source
        source_name = "Unknown"
        if 'waitrose.com' in parsed.netloc:
            source_name = "Waitrose"
        elif 'tesco.com' in parsed.netloc:
            source_name = "Tesco"
        
        source = {
            "name": source_name,
            "displayName": source_name,
            "sourceRecipeUrl": clean_url
        }
    
    # Determine which collection(s) this recipe belongs to based on title
    collection_ids = get_collection_id_for_recipe(recipe_data['name'])
    collection_names = get_collection_names_for_recipe(recipe_data['name'])

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
            "name": recipe_data['name'],
            "description": recipe_data.get('description', ''),
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