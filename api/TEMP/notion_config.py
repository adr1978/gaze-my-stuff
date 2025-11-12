"""
Centralized Notion API Configuration
Used by all Notion sync scripts across the project.
"""

# Notion API Credentials
NOTION_API_KEY = "ntn_s61903939022oazChTWX0Zlfv7SpvQKGPYv6v1QUITB46F"

# Data Source URLs (NOT Database URLs!)
# These are the actual schema/storage locations
DATA_SOURCES = {
    "transactions_personal": "297170f9-ea2e-8107-b156-000bac70c13c" # For all personal transations (Anthony, Josephine etc)
    # "transactions_business": "", # For all business banking transations
    # "transactions_children": "" # For all children's banking transations
    # Add more data sources as you create them:
    # "transactions_hsbc": "data-source-id-here",
    # "recipes": "data-source-id-here",
}

# API Configuration
NOTION_VERSION = "2025-09-03"