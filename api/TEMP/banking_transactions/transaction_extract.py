"""
Extract transactions from GoCardless API
Pure extraction layer - no transformation logic

This module handles all GoCardless API interactions and data file management.
It doesn't transform data - it just gets it and stores it.
"""
import json
import sys
from pathlib import Path

# Add parent directories to path so we can import from other folders
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from banking_data.gc_client import get_nordigen_client
from .transaction_config import (
    logger,
    METADATA_FILE,
    SYNCED_TRANSACTIONS_FILE
)


# ============================================================================
# METADATA FILE OPERATIONS
# ============================================================================

def load_gc_metadata():
    """
    Load GoCardless metadata from JSON file.
    
    This file contains all requisition info, account details, and sync status.
    Created and maintained by the GoCardless FastAPI routes.
    
    Returns:
        Dict of requisition data, or empty dict if file doesn't exist
    """
    if not METADATA_FILE.exists():
        return {}
    
    try:
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading metadata: {e}")
        return {}


def save_gc_metadata(metadata):
    """
    Save GoCardless metadata back to JSON file.
    
    Updates things like last_synced time, last_api_call time, etc.
    
    Args:
        metadata: Complete metadata dict to save
    """
    try:
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving metadata: {e}")


# ============================================================================
# SYNCED TRANSACTIONS TRACKING
# ============================================================================

def load_synced_transactions():
    """
    Load tracking of already-synced transactions.
    
    This file prevents duplicate syncing. Each transaction ID is tracked
    with its sync status to avoid re-creating pages in Notion.
    
    Returns:
        Dict keyed by account_id, then transaction_id
    """
    if not SYNCED_TRANSACTIONS_FILE.exists():
        return {}
    
    try:
        with open(SYNCED_TRANSACTIONS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading synced transactions: {e}")
        return {}


def save_synced_transactions(synced):
    """
    Save synced transactions tracking file.
    
    Creates a backup before saving in case something goes wrong.
    
    Args:
        synced: Complete tracking dict to save
    """
    try:
        # Create backup of existing file first
        if SYNCED_TRANSACTIONS_FILE.exists():
            backup = SYNCED_TRANSACTIONS_FILE.with_suffix('.json.bak')
            with open(SYNCED_TRANSACTIONS_FILE, 'r') as f:
                with open(backup, 'w') as b:
                    b.write(f.read())
        
        # Now write the new version
        with open(SYNCED_TRANSACTIONS_FILE, 'w') as f:
            json.dump(synced, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving synced transactions: {e}")


# ============================================================================
# GOCARDLESS API CALLS
# ============================================================================

def fetch_raw_transactions(account_id, test_data_response=None):
    """
    Fetch raw transactions from GoCardless API or test data.
    
    This function either calls the real GoCardless API or uses test data
    if provided. It handles rate limiting gracefully.
    
    Args:
        account_id: GoCardless account UUID
        test_data_response: Optional dict of test data to use instead of API
        
    Returns:
        Raw transaction response dict from GoCardless, or None if rate limited
        Format: {
            "transactions": {
                "booked": [...],
                "pending": [...]
            }
        }
    """
    try:
        # Test mode - use provided data instead of API call
        if test_data_response:
            logger.info(f"Using test data for account {account_id}")
            return test_data_response
        
        # Real mode - call GoCardless API
        client = get_nordigen_client()
        transactions_response = client.account_api(account_id).get_transactions()
        return transactions_response
        
    except Exception as e:
        # Check if we hit rate limit (429 error or "rate" in message)
        if "429" in str(e) or "rate" in str(e).lower():
            logger.warning(f"Rate limited for account {account_id}: {e}")
            return None  # Return None so caller knows to skip
        else:
            # Other errors should be raised
            logger.error(f"Error fetching transactions for {account_id}: {e}")
            raise


# ============================================================================
# ACCOUNT FILTERING
# ============================================================================

def get_all_accounts_to_sync(specific_account=None):
    """
    Get all accounts that need to be synced.
    
    Reads metadata and filters accounts based on:
    - Whether sync is enabled for that account
    - Whether it matches a specific account ID if provided
    
    Args:
        specific_account: Optional account ID to sync only that account
        
    Returns:
        List of tuples: (requisition_id, owner, account_info_dict)
    """
    metadata = load_gc_metadata()
    accounts_to_sync = []
    
    # Iterate through all requisitions
    for req_id, req_data in metadata.items():
        accounts = req_data.get("accounts", [])
        owner = req_data.get("owner", "Unknown")
        
        # Check each account in this requisition
        for account in accounts:
            account_id = account.get("account_id")
            
            # Skip if we're looking for a specific account and this isn't it
            if specific_account and account_id != specific_account:
                continue
            
            # Skip if sync is disabled via the web UI toggle
            if not account.get("sync_enabled", True):
                institution_name = account.get("institution_name")
                last_four = account.get("last_four")
                logger.info(f"Skipping {institution_name} ****{last_four} (sync disabled)")
                continue
            
            # This account should be synced!
            accounts_to_sync.append((req_id, owner, account))
    
    return accounts_to_sync