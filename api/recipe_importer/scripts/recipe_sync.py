"""
Recipe Synchronization Logic
Handles comparing Whisk data vs Local Tracker and executing A/B/C logic.
"""
import logging
import os
from datetime import datetime
from .whisk_auth import get_access_token
from .whisk_fetch import fetch_whisk_recipes
from .recipe_sync_tracker import load_tracker
from .recipe_notion_adapter import (
    save_recipe_to_notion, 
    update_recipe_image_in_notion, 
    update_recipe_video_in_notion,
    delete_recipe_from_notion
)

# Custom Logger for Sync Job
logger = logging.getLogger("recipe_sync_job")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('INFO:     [Recipe Sync Job] %(message)s'))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

def fetch_whisk_list(limit=100, after_cursor=None):
    """
    Fetches a page of recipes from Whisk API v2 (List View).
    """
    token_data = get_access_token()
    if not token_data or not token_data.get('access_token'):
        raise Exception("Failed to authenticate with Whisk")
    
    access_token = token_data['access_token']
    url = "https://api.whisk.com/recipe/v2"
    
    params = {"paging.limit": limit}
    if after_cursor:
        params["paging.cursors.after"] = after_cursor

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    import requests
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

def fetch_recipe_details(recipe_id):
    """
    Fetches full details (including instructions) for a single recipe.
    """
    token_data = get_access_token()
    access_token = token_data['access_token']
    
    url = "https://api.whisk.com/recipe/v2/get"
    params = {
        "id": recipe_id,
        "fields": ["RECIPE_FIELD_INSTRUCTIONS", "RECIPE_FIELD_SAVED"]
    }
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    import requests
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

def validate_list_requirements(content, collections):
    """
    Validates fields present in the List View (Phase 1).
    Returns (is_valid: bool, failure_reason: str).
    """
    # 1. Check Source Name
    source_name = content.get('source', {}).get('display_name')
    if not source_name:
        return False, "Missing Source Name"

    # 2. Check Images (Must have at least one valid URL)
    images = content.get('images', [])
    if not images or not images[0].get('url'):
        return False, "Missing Image"

    # 3. Check Category (Collections)
    if not collections:
        return False, "Missing Category"

    # 4. Check Ingredients
    ingredients = content.get('ingredients', [])
    if not ingredients:
        return False, "Missing Ingredients"

    return True, None

def validate_instructions(details):
    """
    Validates fields that require the Detail View (Phase 2).
    """
    if not details or 'recipe' not in details:
        return False, "Failed to fetch details"
        
    steps = details['recipe'].get('instructions', {}).get('steps', [])
    if not steps:
        return False, "Missing Instructions"
        
    return True, None

def transform_whisk_to_internal(content, collections=None, details=None):
    """
    Maps Whisk content to internal RecipeSchema.
    """
    internal_data = {
        "title": content.get('name'),
        "description": content.get('description'),
        "url": content.get('source', {}).get('source_recipe_url'),
        "source": content.get('source', {}).get('display_name'),
        "servings": content.get('servings'),
        "prep_time": content.get('durations', {}).get('prep_time'),
        "cook_time": content.get('durations', {}).get('cook_time'),
        "category": [], 
        "ingredients": [],
        "instructions": [],
        "imageUrl": None
    }

    # Images
    images = content.get('images', [])
    if images:
        internal_data['imageUrl'] = images[0].get('url')

    # Ingredients (List View)
    raw_ingredients = content.get('ingredients', [])
    for ing in raw_ingredients:
        internal_data['ingredients'].append({"text": ing.get('text')})

    # Instructions (Detail View)
    if details and 'recipe' in details and 'instructions' in details['recipe']:
        steps = details['recipe']['instructions'].get('steps', [])
        for step in steps:
            internal_data['instructions'].append({
                "text": step.get('text'),
                "group": step.get('group')
            })

    # Categories
    if collections:
        for collection in collections:
            name = collection.get('name')
            if name:
                internal_data['category'].append(name)

    return internal_data

def run_sync(full_sync=False, notion_event_page_id=None):
    """
    Main execution entry point.
    """
    logger.info(f"🚀 Starting Recipe Sync (Full Sync: {full_sync})")
    
    limit = int(os.getenv("WHISK_FETCH_LIMIT", 100))
    next_cursor = None
    all_whisk_recipes = []
    
    # 1. Fetch from Whisk
    while True:
        logger.info(f"Fetching Whisk recipes (Limit: {limit})...")
        data = fetch_whisk_list(limit=limit, after_cursor=next_cursor)
        
        recipes_list = data.get('recipes', [])
        all_whisk_recipes.extend(recipes_list)
        
        paging = data.get('paging', {})
        cursors = paging.get('cursors', {})
        next_cursor = cursors.get('after')
        
        if not next_cursor:
            break 
            
        if not full_sync:
            if len(all_whisk_recipes) >= limit:
                break

    logger.info(f"Fetched {len(all_whisk_recipes)} recipes from Whisk.")
    
    # 2. Load Tracker
    tracker = load_tracker()
    processed_ids = set()
    
    # Stats initialization
    stats = {
        "matched": 0, 
        "updated": 0, 
        "created": 0, 
        "deleted": 0, 
        "errors": 0,
        "rejected": 0,
        "rejection_details": []
    }

    # 3. Process
    for item in all_whisk_recipes:
        try:
            content = item.get('content', {})
            collections = item.get('collections', [])
            whisk_id = content.get('id')
            title = content.get('name') 
            
            if not whisk_id:
                continue
            
            # --- VALIDATION PHASE 1 ---
            is_valid, reason = validate_list_requirements(content, collections)
            if not is_valid:
                logger.warning(f"  -> Rejecting {whisk_id} ('{title}'): {reason}")
                stats["rejected"] += 1
                stats["rejection_details"].append({
                    "id": whisk_id,
                    "name": title or 'Unknown',
                    "reason": reason
                })
                continue

            processed_ids.add(whisk_id)
            local_record = tracker.get(whisk_id)
            
            notion_page_id = None
            if local_record:
                notion_page_id = local_record.get('notion_page_id') or local_record.get('notion_id')

            # --- EXISTING RECIPE CHECK (Updates) ---
            if local_record:
                updates_performed = False
                
                # A: Image Update
                if local_record.get('image_type') == 'external':
                    logger.info(f"Scenario B (Image): Updating image for {whisk_id}")
                    images = content.get('images', [])
                    img_url = images[0].get('url') if images else None
                    
                    if img_url and notion_page_id:
                        if update_recipe_image_in_notion(notion_page_id, whisk_id, img_url, title):
                            updates_performed = True
                        else:
                            stats["errors"] += 1
                
                # B: Video Update
                # Check if Whisk has video URL
                video_url = None
                recipe_videos = content.get('recipe_videos', [])
                if recipe_videos:
                    for vid in recipe_videos:
                        if 'youtube_video' in vid:
                            video_url = vid['youtube_video'].get('original_link')
                            break
                        # Can add tiktok check here if needed
                
                # Logic: If video exists in Whisk AND local record says false
                if video_url and not local_record.get('recipe_video'):
                    logger.info(f"Scenario B (Video): Adding video for {whisk_id}")
                    if update_recipe_video_in_notion(notion_page_id, whisk_id, video_url):
                        updates_performed = True
                    else:
                        stats["errors"] += 1

                if updates_performed:
                    stats["updated"] += 1
                else:
                    stats["matched"] += 1

            # --- NEW RECIPE ---
            else:
                logger.info(f"Scenario C: Creating new recipe {whisk_id}")
                
                details = fetch_recipe_details(whisk_id)
                
                is_valid_inst, reason_inst = validate_instructions(details)
                if not is_valid_inst:
                    logger.warning(f"  -> Skipping Creation for {whisk_id}: {reason_inst}")
                    stats["rejected"] += 1
                    stats["rejection_details"].append({
                        "id": whisk_id,
                        "name": title or 'Unknown',
                        "reason": reason_inst
                    })
                    continue

                recipe_data = transform_whisk_to_internal(content, collections, details)
                
                added_at_ms = item.get('added_at')
                if added_at_ms:
                    try:
                        dt = datetime.fromtimestamp(int(added_at_ms) / 1000.0)
                        recipe_data['date_added_iso'] = dt.isoformat()
                    except Exception as e:
                        logger.warning(f"Failed to parse added_at date: {e}")
                
                success = save_recipe_to_notion(recipe_data, whisk_id)
                if success: stats["created"] += 1
                else: stats["errors"] += 1

        except Exception as e:
            logger.error(f"Error processing recipe {item.get('content', {}).get('id', 'unknown')}: {e}")
            stats["errors"] += 1

    # 4. Deletion (Only if Full Sync)
    if full_sync:
        local_ids = set(tracker.keys())
        ids_to_delete = local_ids - processed_ids
        
        if ids_to_delete:
            logger.info(f"Found {len(ids_to_delete)} recipes to remove from Notion.")
            for wid in ids_to_delete:
                record = tracker[wid]
                page_id = record.get('notion_page_id')
                try:
                    if page_id:
                        delete_recipe_from_notion(page_id, wid)
                        stats["deleted"] += 1
                    else:
                        logger.warning(f"Skipping deletion for {wid}: No Page ID found.")
                except Exception as e:
                    logger.error(f"Error deleting {wid}: {e}")

    # 5. Summary Log
    summary = f"""
    --------------------------------------------------
    🏁 Sync Job Complete
    --------------------------------------------------
    Total Processed from Whisk: {len(all_whisk_recipes)}
    Matched (No Change):      {stats['matched']}
    Updated (Improved):       {stats['updated']}
    Created (New):            {stats['created']}
    Deleted (Notion Only):    {stats['deleted']}
    Rejected (Invalid Data):  {stats['rejected']}
    Errors:                   {stats['errors']}
    --------------------------------------------------
    """
    logger.info(summary)
    
    #if stats['rejection_details']:
    #    logger.info(f"⚠️ Rejection Details: {stats['rejection_details']}")

    if notion_event_page_id:
        logger.info(f"Future Todo: Post summary to Notion Page {notion_event_page_id}")
    
    return stats