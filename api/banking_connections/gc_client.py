from nordigen import NordigenClient
import json
from datetime import datetime
from pathlib import Path
import logging

# --- Configure logging ---
logger = logging.getLogger("uvicorn.error")

# Your GoCardless API credentials
SECRET_ID = "446c454b-9338-47dd-997b-572eb01ef2ce"
SECRET_KEY = "0e0b8f2f6e9ebc8d046e5965e8ee8061404954b8db8aba6d780f028ca470a4d4a2944d0583efdf0c30a9b51ff084eadb011ac0f0561c555152e03ed8555a8e9f"

# Metadata file path
BASE_DIR = Path(__file__).parent
METADATA_FILE = BASE_DIR / "gc_metadata.json"


def get_nordigen_client():
    """Initialize and return a Nordigen client with fresh token."""
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