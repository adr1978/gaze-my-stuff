"""
Recipe Synchronization Logic
Handles comparing Whisk data vs Local Tracker and executing A/B/C logic.
"""
import logging
import os
import time
from datetime import datetime
from .whisk_auth import get_access_token
from .whisk_fetch import fetch_whisk_list, fetch_recipe_details, fetch_recipe_review_status
from .recipe_sync_tracker import load_tracker, add_or_update_record
from .recipe_notion_adapter import (
    save_recipe_to_notion, 
    update_recipe_image_in_notion, 
    update_recipe_video_in_notion,
    update_recipe_made_status_in_notion,
    delete_recipe_from_notion
)
from .whisk_collections import get_collection_name_by_id

# Custom Logger for Sync Job
logger = logging.getLogger("recipe_sync_job")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('INFO:     [Recipe Sync Job] %(message)s'))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

def validate_list_requirements(content, collections):
    """
    Validates fields present in the List View (Phase 1).
    Returns (is_valid: bool, failure_reason: str).
    """
    source_name = content.get('source', {}).get('display_name')
    if not source_name:
        return False, "Missing Source Name"

    images = content.get('images', [])
    if not images or not images[0].get('url'):
        return False, "Missing Image"

    if collections is None: 
        # Passed as None during retry to defer check to Detail view
        pass 
    elif not collections:
        return False, "Missing Category"

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
        "instruction_images": [], 
        "imageUrl": None,
        "video_url": None
    }

    # Images
    images = content.get('images', [])
    if images:
        internal_data['imageUrl'] = images[0].get('url')

    # Video Extraction
    recipe_videos = content.get('recipe_videos', [])
    if recipe_videos:
        for vid in recipe_videos:
            if 'youtube_video' in vid:
                internal_data['video_url'] = vid['youtube_video'].get('original_link')
                break
            elif 'tiktok_video' in vid:
                internal_data['video_url'] = vid['tiktok_video'].get('original_link')
                break

    # Ingredients
    raw_ingredients = content.get('ingredients', [])
    for ing in raw_ingredients:
        internal_data['ingredients'].append({"text": ing.get('text')})

    # Instructions
    if details and 'recipe' in details and 'instructions' in details['recipe']:
        steps = details['recipe']['instructions'].get('steps', [])
        for index, step in enumerate(steps):
            internal_data['instructions'].append({
                "text": step.get('text'),
                "group": step.get('group')
            })
            
            step_images = step.get('images', [])
            if step_images:
                img_url = step_images[0].get('url')
                if img_url:
                    internal_data['instruction_images'].append({
                        "url": img_url,
                        "step_number": index + 1
                    })

    # Categories
    if collections:
        for collection in collections:
            name = collection.get('name')
            if name:
                internal_data['category'].append(name)
    elif details and 'recipe' in details:
        saved_data = details['recipe'].get('saved', {})
        collection_ids = saved_data.get('collection_ids', [])
        for c_id in collection_ids:
            name = get_collection_name_by_id(c_id)
            if name:
                internal_data['category'].append(name)

    return internal_data

def run_sync(full_sync=False, retry_rejected=False, notion_event_page_id=None):
    """
    Main execution entry point.
    """
    logger.info(f"🚀 Starting Recipe Sync (Full Sync: {full_sync}, Retry Rejected: {retry_rejected})")
    
    # 1. Get Token ONCE at start
    token_data = get_access_token()
    if not token_data or not token_data.get('access_token'):
        logger.error("❌ Failed to authenticate with Whisk. Aborting sync.")
        return {"errors": 1}
    
    access_token = token_data['access_token']

    tracker = load_tracker()
    
    stats = {
        "matched": 0, 
        "updated": 0, 
        "created": 0, 
        "deleted": 0, 
        "errors": 0,
        "rejected": 0,
        "retried_success": 0,
        "rejection_details": []
    }

    # --- 2. RETRY REJECTED LOGIC (EXCLUSIVE) ---
    if retry_rejected:
        logger.info("🔄 RETRY MODE: Processing previously rejected recipes...")
        rejected_ids = [k for k, v in tracker.items() if v.get('status') == 'rejected']
        
        if not rejected_ids:
            logger.info("  -> No rejected recipes found to retry.")
        
        for whisk_id in rejected_ids:
            # Fetch title from tracker if available, or default
            record = tracker.get(whisk_id, {})
            current_title = record.get('recipe_title') or 'Unknown Title'
            
            logger.info(f"  -> Retrying {whisk_id} ('{current_title}')...")
            
            try:
                # Fetch full details directly
                details = fetch_recipe_details(whisk_id, access_token=access_token)
                if not details or 'recipe' not in details:
                    logger.warning(f"     -> Failed to fetch details for {whisk_id}. Still rejected.")
                    continue
                
                content = details['recipe']
                title = content.get('name')
                
                # [FIX] Pass None for collections so validate_list_requirements skips category check
                # Category will be checked later after transform
                collections = None 
                
                is_valid, reason = validate_list_requirements(content, collections)
                if not is_valid:
                     logger.warning(f"     -> Still Invalid: {reason}")
                     continue
                     
                is_valid_inst, reason_inst = validate_instructions(details)
                if not is_valid_inst:
                     logger.warning(f"     -> Still Invalid: {reason_inst}")
                     continue

                recipe_data = transform_whisk_to_internal(content, None, details)
                
                if not recipe_data['category']:
                    logger.warning(f"     -> Still Invalid: Missing Category (Mapped from IDs)")
                    continue

                logger.info(f"     -> Validation passed! Creating Notion page...")
                
                time.sleep(0.5)
                was_made = fetch_recipe_review_status(whisk_id, access_token=access_token)
                
                added_at_ms = content.get('added_at') 
                if added_at_ms:
                    try:
                        dt = datetime.fromtimestamp(int(added_at_ms) / 1000.0)
                        recipe_data['date_added_iso'] = dt.isoformat()
                    except: pass

                success = save_recipe_to_notion(recipe_data, whisk_id, was_made=was_made)
                if success: 
                    stats["retried_success"] += 1
                    logger.info(f"     -> ✅ Successfully recovered '{title}' (Whisk ID: {whisk_id})")
                else: 
                    stats["errors"] += 1

            except Exception as e:
                logger.error(f"     -> Error retrying {whisk_id}: {e}")
                stats["errors"] += 1
        
        # Return immediately after retry logic
        logger.info(f"🏁 Retry Job Complete. Recovered: {stats['retried_success']}")
        return stats
    

    # --- 3. NORMAL SYNC LOGIC (Only runs if retry_rejected=False) ---
    
    limit = int(os.getenv("WHISK_FETCH_LIMIT", 100))
    next_cursor = None
    all_whisk_recipes = []
    
    while True:
        logger.info(f"🔎 Fetching Whisk recipes (Limit: {limit})...")
        data = fetch_whisk_list(limit=limit, after_cursor=next_cursor, access_token=access_token)
        
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

    logger.info(f"  -> Fetched {len(all_whisk_recipes)} recipes from Whisk.")
    processed_ids = set()
    
    # --- Process Recipes ---
    for item in all_whisk_recipes:
        try:
            content = item.get('content', {})
            collections = item.get('collections', []) # Valid for List View
            whisk_id = content.get('id')
            title = content.get('name') 
            
            if not whisk_id:
                continue
            
            # --- VALIDATION PHASE 1 (List View) ---
            is_valid, reason = validate_list_requirements(content, collections)
            if not is_valid:
                # Log rejection details
                logger.warning(f"Rejecting recipe (Whisk ID: {whisk_id})")
                logger.warning(f"  -> {reason} ('{title}')")
                stats["rejected"] += 1
                stats["rejection_details"].append({
                    "id": whisk_id,
                    "name": title or 'Unknown',
                    "reason": reason
                })
                
                add_or_update_record(
                    whisk_recipe_id=whisk_id,
                    notion_page_id=None,
                    image_type=None,
                    status="rejected",
                    recipe_video=False,
                    instruction_photos=False,
                    was_made=False,
                    recipe_title=title
                )
                continue

            processed_ids.add(whisk_id)
            local_record = tracker.get(whisk_id)
            
            notion_page_id = None
            if local_record:
                notion_page_id = local_record.get('notion_page_id') or local_record.get('notion_id')

            # --- CHECK IF MADE? ---
            was_made = False
            should_check_made = True
            if local_record and local_record.get('was_made'):
                was_made = True
                should_check_made = False

            if should_check_made:
                time.sleep(0.5) 
                was_made = fetch_recipe_review_status(whisk_id, access_token=access_token)

            # --- EXISTING RECIPE CHECK (Updates) ---
            if local_record:
                # If previously rejected but now valid in list view, treat as New
                if local_record.get('status') == 'rejected':
                     local_record = None # Force fall-through to Create logic
                else:
                    updates_performed = False
                    recreation_triggered = False # Flag to skip other updates if recreating
                                        
                    # D: Instruction Photos Update (Check First: Re-create strategy)
                    if not local_record.get('instruction_photos'):
                        details = fetch_recipe_details(whisk_id, access_token=access_token)
                        
                        has_step_photos = False
                        if details and 'recipe' in details:
                             steps = details['recipe'].get('instructions', {}).get('steps', [])
                             for step in steps:
                                 if step.get('images'):
                                     has_step_photos = True
                                     break
                        
                        if has_step_photos:
                            logger.info(f"Updating existing recipe (Whisk ID: {whisk_id})")
                            logger.info(f"  -> Adding Instruction photos (by removing and re-creating page)...")
                            
                            delete_recipe_from_notion(notion_page_id, whisk_id)
                            
                            recipe_data = transform_whisk_to_internal(content, collections, details)
                            
                            added_at_ms = item.get('added_at')
                            if added_at_ms:
                                try:
                                    dt = datetime.fromtimestamp(int(added_at_ms) / 1000.0)
                                    recipe_data['date_added_iso'] = dt.isoformat()
                                except Exception: pass
                            
                            if save_recipe_to_notion(recipe_data, whisk_id, was_made=was_made):
                                 updates_performed = True
                                 recreation_triggered = True # Don't run A/B/C
                            else:
                                 stats["errors"] += 1
                        
                        else:
                            # No photos found, but we checked. 
                            # Could update tracker to avoid re-checking, but for now we leave logic as is.
                            pass

                    # Only check A, B, C if we didn't just delete and re-create the page
                    if not recreation_triggered:
                        
                        # A: Image Update
                        if local_record.get('image_type') == 'external':
                            logger.info(f"Updating existing recipe (Whisk ID: {whisk_id})")
                            #logger.info(f"Replacing referenced image with uploaded image")
                            
                            images = content.get('images', [])
                            img_url = images[0].get('url') if images else None
                            
                            if img_url and notion_page_id:
                                if update_recipe_image_in_notion(notion_page_id, whisk_id, img_url, title):
                                    updates_performed = True
                                else:
                                    stats["errors"] += 1
                        
                        # B: Video Update
                        video_url = None
                        recipe_videos = content.get('recipe_videos', [])
                        if recipe_videos:
                            for vid in recipe_videos:
                                if 'youtube_video' in vid:
                                    video_url = vid['youtube_video'].get('original_link')
                                    break
                                elif 'tiktok_video' in vid:
                                    video_url = vid['tiktok_video'].get('original_link')
                                    break
                        
                        if video_url and not local_record.get('recipe_video'):
                            logger.info(f"Updating existing recipe (Whisk ID: {whisk_id})")
                            #logger.info(f"Adding YouTube linked video to recipe")
                            
                            if update_recipe_video_in_notion(notion_page_id, whisk_id, video_url, title):
                                updates_performed = True
                            else:
                                stats["errors"] += 1

                        # C: Was Made Update
                        local_made = local_record.get('was_made', False)
                        if was_made and not local_made:
                            logger.info(f"Updating existing recipe (Whisk ID: {whisk_id})")
                            #logger.info(f"Marking recipe as 'made'")
                        
                            if update_recipe_made_status_in_notion(notion_page_id, whisk_id, True, title):
                                updates_performed = True
                            else:
                                stats["errors"] += 1

                    if updates_performed:
                        stats["updated"] += 1
                    else:
                        stats["matched"] += 1

            # --- NEW RECIPE ---
            if not local_record:
                logger.info(f"Creating new recipe (Whisk ID: {whisk_id})")
                
                details = fetch_recipe_details(whisk_id, access_token=access_token)
                
                # Phase 2 Validation (Instructions)
                is_valid_inst, reason_inst = validate_instructions(details)
                if not is_valid_inst:
                    logger.warning(f"  -> Skipping Creation for {whisk_id}: {reason_inst}")
                    stats["rejected"] += 1
                    stats["rejection_details"].append({
                        "id": whisk_id,
                        "name": title or 'Unknown',
                        "reason": reason_inst
                    })
                    add_or_update_record(
                        whisk_recipe_id=whisk_id,
                        notion_page_id=None,
                        status="rejected",
                        was_made=False,
                        recipe_title=title
                    )
                    continue

                # Transform (Scenario C)
                recipe_data = transform_whisk_to_internal(content, collections, details)
                
                # Extra Safety: Check if categories were actually mapped
                if not recipe_data['category']:
                    logger.warning(f"  -> Skipping Creation for {whisk_id}: Missing Category")
                    stats["rejected"] += 1
                    stats["rejection_details"].append({
                        "id": whisk_id,
                        "name": title or 'Unknown',
                        "reason": "Missing Category (Detail view mapping failed)"
                    })
                    add_or_update_record(
                        whisk_recipe_id=whisk_id,
                        notion_page_id=None,
                        status="rejected",
                        was_made=False,
                        recipe_title=title
                    )
                    continue

                added_at_ms = item.get('added_at')
                if added_at_ms:
                    try:
                        dt = datetime.fromtimestamp(int(added_at_ms) / 1000.0)
                        recipe_data['date_added_iso'] = dt.isoformat()
                    except Exception as e:
                        logger.warning(f"Failed to parse added_at date: {e}")
                
                success = save_recipe_to_notion(recipe_data, whisk_id, was_made=was_made)
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
                if record.get('status') == 'rejected':
                    continue
                    
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
    Matched:      {stats['matched']}
    Updated:      {stats['updated']}
    Created:      {stats['created']}
    Deleted:      {stats['deleted']}
    Rejected:     {stats['rejected']}
    Retried OK:   {stats['retried_success']}
    Errors:       {stats['errors']}
    --------------------------------------------------
    """
    logger.info(summary)
    
    #if stats['rejection_details']:
    #    logger.info(f"⚠️ Rejection Details: {stats['rejection_details']}")

    if notion_event_page_id:
        logger.info(f"Future Todo: Post summary to Notion Page {notion_event_page_id}")
    
    return stats