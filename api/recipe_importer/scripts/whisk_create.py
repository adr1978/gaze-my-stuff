"""
Whisk Recipe Creation Module
"""

import requests
import logging
from urllib.parse import urlparse, urlunparse
from .whisk_collections import (
    get_collection_id_for_recipe, 
    get_collection_names_for_recipe, 
    get_collection_id_from_category
)

# Setup clean logger
logger = logging.getLogger("whisk_importer")
# We assume the handler is set up by the main entry point or previous scripts, 
# but we ensure it exists just in case.
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('INFO:     [Whisk] %(message)s'))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

RECIPES_API_URL = "https://graph.whisk.com/v1/recipes"

def create_recipe_in_whisk(access_token: str, recipe_data: dict) -> dict:
    
    logger.info(f"  -> Creating recipe payload for: {recipe_data.get('name', 'Unknown')}")
    
    # --- INGREDIENTS LOGIC ---
    ingredients_list = []
    for ing in recipe_data.get('ingredients', []):
        # Case 1: Simple string (Schema/AI format)
        if isinstance(ing, str):
            ingredients_list.append({"text": ing})
        # Case 2: Dict (Legacy/Scraper format)
        elif isinstance(ing, dict):
            ing_dict = {"text": ing.get('text', '')}
            if ing.get('group'):
                ing_dict["group"] = ing['group']
            ingredients_list.append(ing_dict)
    
    # --- INSTRUCTIONS LOGIC ---
    instructions_list = []
    for instruction in recipe_data.get('instructions', []):
        if instruction:
            instructions_list.append({"text": instruction, "customLabels": []})
    
    # Handle Cook's Tips
    if recipe_data.get('cooks_tip'):
        tips = recipe_data.get('cooks_tip')
        if isinstance(tips, str):
            tips = [t.strip() for t in tips.split('\n\n') if t.strip()]
        for tip in tips:
            if tip:
                instructions_list.append({"text": tip, "group": "Cook's tip", "customLabels": []})
    
    # --- DURATIONS ---
    durations = {}
    if recipe_data.get('prep_time'): durations['prepTime'] = int(recipe_data['prep_time'])
    if recipe_data.get('cook_time'): durations['cookTime'] = int(recipe_data['cook_time'])
    if recipe_data.get('total_time'): durations['totalTime'] = int(recipe_data['total_time'])
    
    # --- IMAGES (FIXED) ---
    # Check 'imageUrl' (Schema standard) AND 'image_url' (Legacy fallback)
    img_url = recipe_data.get('imageUrl') or recipe_data.get('image_url')
    images = [{"url": img_url}] if img_url else []
    
    # --- SERVINGS ---
    try:
        servings = int(recipe_data.get('servings', 1) or 1)
    except (ValueError, TypeError):
        servings = 1
    
    # --- SOURCE ---
    source = None
    # Check 'url' (Schema standard) AND 'source_url' (Legacy fallback)
    src_url = recipe_data.get('url') or recipe_data.get('source_url')
    
    if src_url:
        try:
            parsed = urlparse(src_url)
            clean_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
            source_name = "Waitrose" if 'waitrose.com' in parsed.netloc else "Tesco" if 'tesco.com' in parsed.netloc else "Unknown"
            source = {"name": source_name, "displayName": source_name, "sourceRecipeUrl": clean_url}
        except Exception:
            logger.warning("Failed to parse source URL")

    # --- CATEGORY LOGIC ---
    collection_ids = []
    
    # 1. Try explicit Category first
    provided_category = recipe_data.get('category')
    if provided_category:
        direct_id = get_collection_id_from_category(provided_category)
        if direct_id:
            collection_ids.append(direct_id)
            logger.info(f"  -> Category mapped: {provided_category}")
        else:
            logger.warning(f"Category '{provided_category}' not found in map.")

    # 2. Fallback to Title Guessing
    if not collection_ids and recipe_data.get('name'):
        collection_ids = get_collection_id_for_recipe(recipe_data['name'])
        if collection_ids:
            names = get_collection_names_for_recipe(recipe_data['name'])
            logger.info(f"Category auto-guessed: {', '.join(names)}")

    # 3. Default
    if not collection_ids:
        from .whisk_collections import COLLECTIONS
        collection_ids = [COLLECTIONS["Vegetarian"]]
        logger.info("Category default: Vegetarian")

    # --- BUILD PAYLOAD ---
    recipe_payload = {
        "payload": {
            "name": recipe_data.get('name', 'Untitled Recipe'),
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
      
    if source:
        recipe_payload["payload"]["source"] = source
    
    headers = {
        "Authorization": f"Token {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    response = requests.post(RECIPES_API_URL, headers=headers, json=recipe_payload)
    
    try:
        response.raise_for_status()
    except requests.HTTPError as e:
        error_info = {"message": f"{response.status_code} {response.reason}", "body": response.text}
        logger.error(f"Whisk API Error: {error_info['message']}")
        e.error_info = error_info
        raise e
    
    return response.json()