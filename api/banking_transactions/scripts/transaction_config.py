"""
Configuration for banking transaction sync

This module contains all configuration constants, file paths, and mappings
used by the transaction sync process. Update values here to change behavior.
"""
import logging
from pathlib import Path

# ============================================================================
# FILE PATHS
# ============================================================================

# Base directory of this file (now in scripts folder)
BASE_DIR = Path(__file__).parent

# Synced transactions tracking (in data folder one level up)
SYNCED_TRANSACTIONS_FILE = BASE_DIR.parent / "data" / "synced_transactions.json"

# GoCardless metadata lives in src/data folder
METADATA_FILE = BASE_DIR.parent.parent.parent / "src" / "data" / "gc_metadata.json"

# Logs are handled by CallLogger now (stored in data/logs/ within this module)
# No need for old LOG_DIR and LOG_FILE

# ============================================================================
# LOGGING SETUP
# ============================================================================

# Configure logging to console only (CallLogger handles file logging)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Print to console
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# OWNER TO DATA SOURCE MAPPING
# ============================================================================

# Maps account owner names to Notion data source keys
# Used to route transactions to correct Notion database
OWNER_TO_DATA_SOURCE = {
    "Anthony": "transactions_personal",      # Personal accounts
    "Josephine": "transactions_personal",    # Personal accounts
    "Business": "transactions_business",     # Business accounts
    "Children": "transactions_children",     # Children's accounts
}

# ============================================================================
# ACCOUNT TYPE MAPPING
# ============================================================================

# Maps GoCardless account type codes to human-readable names
# These are used as select options in Notion
ACCOUNT_TYPE_MAPPING = {
    "CACC": "Current Account",   # Current/checking account
    "SVGS": "Savings Account",   # Savings account
    "CARD": "Credit Card"        # Credit card
}
