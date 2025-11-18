# api/banking_connections/scripts/gc_client.py

import os
from dotenv import load_dotenv # <-- NEW: Import load_dotenv
from nordigen import NordigenClient
import json
import logging
from pathlib import Path
# ... (other imports from original file)

# Load environment variables from .env file
load_dotenv() # <-- NEW: Load env variables at the start

# --- Configure logging ---
logger = logging.getLogger("uvicorn.error")

# Your GoCardless API credentials
SECRET_ID = os.getenv("GOCARDLESS_SECRET_ID")
SECRET_KEY = os.getenv("GOCARDLESS_SECRET_KEY")


# Metadata file path
BASE_DIR = Path(__file__).parent.parent 
METADATA_FILE = BASE_DIR / "data" / "gc_metadata.json"


def get_nordigen_client():
    """Initialize and return a Nordigen client with fresh token."""
    # Ensure keys are loaded before attempting to use them
    if not SECRET_ID or not SECRET_KEY:
        logger.error("GOCARDLESS_SECRET_ID or GOCARDLESS_SECRET_KEY not set!")
        # Raising an exception here prevents silent failures further down
        raise ValueError("GoCardless API keys are missing. Please check .env file.")
        
    client = NordigenClient(
        secret_id=SECRET_ID,
        secret_key=SECRET_KEY
    )
    # Generate new access token
    token_data = client.generate_token()
    return client

#
# --- FUNCTION MOVED HERE ---
#
def load_gc_metadata():
    """Load metadata from JSON file."""
    if not METADATA_FILE.exists():
        return {}
    try:
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading metadata: {e}")
        return {}

#
# --- FUNCTION MOVED HERE ---
#
def save_gc_metadata(metadata):
    """Save metadata to JSON file."""
    try:
        # Create backup
        if METADATA_FILE.exists():
            backup = METADATA_FILE.with_suffix('.json.bak')
            with open(METADATA_FILE, 'r') as f:
                with open(backup, 'w') as b:
                    b.write(f.read())
        
        # Write new data
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving metadata: {e}")