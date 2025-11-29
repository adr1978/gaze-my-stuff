"""
Sync Tracker
Manages the local state of recipes synced to Notion.
File: api/recipe_importer/data/sync_status.json
"""
import json
import logging
import time
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

# Path to the local sync file
DATA_DIR = Path(__file__).parent.parent / "data"
TRACKER_FILE = DATA_DIR / "sync_status.json"

def _ensure_file_exists():
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not TRACKER_FILE.exists():
        with open(TRACKER_FILE, 'w') as f:
            json.dump({}, f)

def load_tracker() -> dict:
    """Returns the full tracker dictionary {whisk_recipe_id: record}."""
    _ensure_file_exists()
    try:
        with open(TRACKER_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def save_tracker(data: dict):
    """Saves the tracker dictionary to disk."""
    _ensure_file_exists()
    with open(TRACKER_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def add_or_update_record(whisk_recipe_id, notion_page_id, image_type=None, status="new", recipe_video=None, instruction_photos=None):
    """
    Updates or creates a record for a recipe.
    Allows updating specific flags while preserving others if passed as None.
    """
    data = load_tracker()
    
    # Preserve existing flags if updating
    existing = data.get(whisk_recipe_id, {})
    
    # Determine values (New Value -> Existing Value -> Default)
    final_image_type = image_type if image_type is not None else existing.get("image_type", "file_upload")
    final_recipe_video = recipe_video if recipe_video is not None else existing.get("recipe_video", False)
    final_instruction_photos = instruction_photos if instruction_photos is not None else existing.get("instruction_photos", False)

    record = {
        "whisk_recipe_id": whisk_recipe_id,
        "notion_page_id": notion_page_id,
        "image_type": final_image_type,
        "recipe_video": final_recipe_video,
        "instruction_photos": final_instruction_photos,
        "status": status,
        "last_synced": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    data[whisk_recipe_id] = record
    save_tracker(data)

def remove_record(whisk_recipe_id):
    """Removes a record from the tracker."""
    data = load_tracker()
    if whisk_recipe_id in data:
        del data[whisk_recipe_id]
        save_tracker(data)
        logger.info(f"Removed {whisk_recipe_id} from sync tracker")