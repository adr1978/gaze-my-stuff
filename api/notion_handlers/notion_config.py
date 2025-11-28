"""
Centralized Notion API Configuration
Used by all Notion sync scripts across the project.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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


