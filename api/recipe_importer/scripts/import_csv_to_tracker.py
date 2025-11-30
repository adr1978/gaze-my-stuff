"""
CSV to Sync Tracker Importer
One-off script to populate sync_status.json from an existing CSV export.
"""
import csv
import json
import re
import unicodedata
import logging
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger("csv_importer")

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
CSV_FILE = DATA_DIR / "notion_all_recipes.csv"
TRACKER_FILE = DATA_DIR / "sync_status.json"

def sanitize_filename(text):
    """
    Sanitizes a string to be safe for filenames:
    - Normalizes unicode
    - Lowercases
    - Replaces spaces with hyphens
    - Removes non-alphanumeric characters (except hyphens/underscores)
    """
    if not text:
        return "unknown-recipe"
        
    # Normalize unicode characters to ASCII approximations
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    
    # Lowercase and replace spaces
    text = text.lower().replace(' ', '-')
    
    # Remove invalid chars (keep a-z, 0-9, -, _)
    text = re.sub(r'[^a-z0-9\-_]', '', text)
    
    # Remove duplicate hyphens and leading/trailing hyphens
    text = re.sub(r'-+', '-', text).strip('-')
    
    return text or "unknown-recipe"

def str_to_bool(val):
    """Converts CSV string boolean to Python boolean."""
    if not val:
        return False
    return val.lower().strip() == "true"

def import_csv():
    if not CSV_FILE.exists():
        logger.error(f"❌ CSV file not found at: {CSV_FILE}")
        return

    tracker_data = {}
    count = 0

    logger.info(f"Reading from: {CSV_FILE}")

    with open(CSV_FILE, 'r', encoding='utf-8-sig') as f: # utf-8-sig handles BOM if present
        reader = csv.DictReader(f)
        
        # Normalize headers (strip whitespace)
        reader.fieldnames = [name.strip() for name in reader.fieldnames]
        
        for row in reader:
            try:
                whisk_id = row.get("Whisk Id")
                notion_id = row.get("Notion Id")
                title_raw = row.get("Title")
                
                if not whisk_id or not notion_id:
                    logger.warning(f"Skipping row with missing IDs: {row}")
                    continue

                # Parse Booleans
                has_video = str_to_bool(row.get("Video?"))
                was_made = str_to_bool(row.get("Made?"))
                has_inst_photos = str_to_bool(row.get("Instruction Photos"))
                
                # Sanitise Title
                clean_title = sanitize_filename(title_raw)

                # Build Record
                record = {
                    "whisk_recipe_id": whisk_id,
                    "notion_page_id": notion_id,
                    "recipe_title": clean_title,
                    "image_type": row.get("Image Type", "external").lower(), # Default to external if missing
                    "recipe_video": has_video,
                    "instruction_photos": has_inst_photos,
                    "was_made": was_made,
                    "status": "imported", # Distinct status for CSV imports
                    "last_synced": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }

                tracker_data[whisk_id] = record
                count += 1
                
            except Exception as e:
                logger.error(f"Error processing row {row}: {e}")

    # Save JSON
    with open(TRACKER_FILE, 'w') as f:
        json.dump(tracker_data, f, indent=2)

    logger.info(f"✅ Successfully imported {count} recipes to {TRACKER_FILE}")

if __name__ == "__main__":
    import_csv()