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

# Base directory of this file
BASE_DIR = Path(__file__).parent

# GoCardless metadata lives in banking_data folder (two levels up)
BANKING_DATA_DIR = BASE_DIR.parent.parent / "banking_data"
METADATA_FILE = BANKING_DATA_DIR / "gc_metadata.json"

# Synced transactions tracking (in this folder)
SYNCED_TRANSACTIONS_FILE = BASE_DIR / "synced_transactions.json"

# Log file location (three levels up in logs folder)
LOG_DIR = BASE_DIR.parent.parent.parent / "logs"
LOG_FILE = LOG_DIR / "transaction_sync.log"

# ============================================================================
# LOGGING SETUP
# ============================================================================

# Create log directory if it doesn't exist
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Configure logging to both file and console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),  # Write to file
        logging.StreamHandler()          # Also print to console
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