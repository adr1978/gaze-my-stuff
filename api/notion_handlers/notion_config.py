"""
Centralized Notion API Configuration
Used by all Notion sync scripts across the project.
"""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configure logging for this module
logger = logging.getLogger(__name__)

# --- FIX: Explicitly find .env file in parent directory ---
# Current file: api/notion_handlers/notion_config.py
# .env location: project_root/.env (3 levels up)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    # logger.info(f"Loaded .env from: {env_path}") # Uncomment to debug path
else:
    # Fallback to standard load (current dir)
    load_dotenv()
    logger.warning(f"Could not find .env at {env_path}, checking current directory...")

# Notion API Credentials (from .env)
NOTION_API_KEY = os.getenv("NOTION_API_KEY")

# Feature Flags
# Controls whether recipes are automatically saved to Notion after Whisk upload
WHISK_SAVE_TO_NOTION = os.getenv("WHISK_SAVE_TO_NOTION", "true").lower() == "true"

# Data Source IDs (Schema/Storage locations)
# These are the actual schema/storage locations for 3rd party integrations
DATA_SOURCES = {
    "transactions_personal": "297170f9-ea2e-8107-b156-000bac70c13c", # For all personal transations (Anthony, Josephine etc)
    # "transactions_business": "", # For all business banking transations
    # "transactions_children": "" # For all children's banking transations
    # "transactions_hsbc": "data-source-id-here",
   "recipes": "415cfe9c-e8a0-4833-9eaf-a4a7a048b536"
}

# API Configuration
NOTION_VERSION = "2025-09-03"