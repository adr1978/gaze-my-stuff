"""
GoCardless Transaction Sync to Notion

Fetches transactions from all enabled accounts and syncs to Notion.
Respects 4 API calls per day limit per account.

Usage:
  python transaction_sync.py                          # Normal run
  python transaction_sync.py --dry-run                # Test without syncing to Notion
  python transaction_sync.py --account-id ACCOUNT_ID  # Sync specific account only
"""

import json
import sys
import logging
from datetime import datetime
from pathlib import Path
# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))  # Go up to scripts/

from banking_data.gc_client import get_nordigen_client
from notion_handlers.notion_config import NOTION_API_KEY, DATA_SOURCES, NOTION_VERSION
from notion_client import Client

# Configuration
BASE_DIR = Path(__file__).parent  # /scripts/notion_handlers/banking_transactions/
BANKING_DATA_DIR = BASE_DIR.parent.parent / "banking_data"
METADATA_FILE = BANKING_DATA_DIR / "gc_metadata.json"
SYNCED_TRANSACTIONS_FILE = BASE_DIR / "synced_transactions.json"
LOG_DIR = BASE_DIR.parent.parent.parent / "logs"
LOG_FILE = LOG_DIR / "transaction_sync.log"

# Setup logging
LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


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


def save_gc_metadata(metadata):
    """Save metadata to JSON file."""
    try:
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving metadata: {e}")


def load_synced_transactions():
    """Load synced transactions tracking file."""
    if not SYNCED_TRANSACTIONS_FILE.exists():
        return {}
    try:
        with open(SYNCED_TRANSACTIONS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading synced transactions: {e}")
        return {}


def save_synced_transactions(synced):
    """Save synced transactions tracking file."""
    try:
        # Create backup
        if SYNCED_TRANSACTIONS_FILE.exists():
            backup = SYNCED_TRANSACTIONS_FILE.with_suffix('.json.bak')
            with open(SYNCED_TRANSACTIONS_FILE, 'r') as f:
                with open(backup, 'w') as b:
                    b.write(f.read())
        
        with open(SYNCED_TRANSACTIONS_FILE, 'w') as f:
            json.dump(synced, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving synced transactions: {e}")


def to_camel_case(text):
    """Convert text to Camel Case."""
    if not text:
        return ""
    return ' '.join(word.capitalize() for word in text.split())


def get_data_source_for_owner(owner):
    """Get the data source ID based on account owner."""
    # Map owners to data source keys - must be explicit!
    owner_mapping = {
        "Anthony": "transactions_personal",
        "Josephine": "transactions_personal",
        "Business": "transactions_business",
        "Children": "transactions_children",
    }
    
    # Get the data source key - NO DEFAULT, must be explicit
    data_source_key = owner_mapping.get(owner)
    if not data_source_key:
        logger.error(f"No data source mapping for owner: {owner}")
        return None
    
    # Look up the actual UUID from DATA_SOURCES
    data_source_id = DATA_SOURCES.get(data_source_key)
    if not data_source_id:
        logger.warning(f"Data source not configured for key: {data_source_key}")
        return None
    
    return data_source_id  # Return the UUID, not the key!


def fetch_transactions_for_account(account_id, account_info, test_data_response=None):
    """
    Fetch transactions for a specific account.
    Returns list of transactions or None if rate limited.
    
    If test_data_response is provided, uses that instead of API call.
    """
    try:
        # Use test data if provided
        if test_data_response:
            logger.info(f"Using test data for account {account_info['last_four']}")
            transactions_response = test_data_response
        else:
            # Fetch from API
            client = get_nordigen_client()
            transactions_response = client.account_api(account_id).get_transactions()
        
        # Extract booked and pending transactions
        booked = transactions_response.get("transactions", {}).get("booked", [])
        pending = transactions_response.get("transactions", {}).get("pending", [])
        
        logger.info(f"Account {account_info['last_four']}: {len(booked)} booked, {len(pending)} pending")
        
        # Process transactions
        processed_transactions = []
        
        for txn in booked + pending:
            transaction_id = txn.get("internalTransactionId")
            
            if not transaction_id:
                logger.warning(f"Transaction missing ID, skipping: {txn}")
                continue
            
            # Extract data
            booking_date = txn.get("bookingDate") or txn.get("valueDate")
            amount_data = txn.get("transactionAmount", {})
            amount = float(amount_data.get("amount", 0))
            currency = amount_data.get("currency", "GBP")
            
            # Debtor name (camel case)
            debtor_name = to_camel_case(txn.get("debtorName", ""))
            
            
            # Transaction info (camel case)
            creditor_name = to_camel_case(txn.get("creditorName", ""))
            
            # Merchant name (use debtor or remittance)
            merchant_name = creditor_name or debtor_name or ""
            
            # Remittance info (camel case)
            remittance_array = txn.get("remittanceInformationUnstructuredArray", [])
            remittance = to_camel_case(
                txn.get("remittanceInformationUnstructured", "") or
                (remittance_array[0] if remittance_array else "")
            )
            
            # Transaction name (use debtor or remittance)
            transaction_name = remittance or "Unknown Transaction"
            
            # Detect cardholder for credit card transactions
            cardholder = None
            if account_info['account_type'] == "CARD":
                additional_data = txn.get("additionalDataStructured", {})
                cardholder_name = additional_data.get("Name", "")
                
                if "JOSEPHINE" in cardholder_name.upper():
                    cardholder = "Josephine"
                else:
                    cardholder = "Anthony"
                
                logger.debug(f"Detected cardholder: {cardholder} from name: {cardholder_name}")
            
            # Status
            status = "booked" if txn in booked else "pending"
            
            processed_txn = {
                "transaction_id": transaction_id,
                "booking_date": booking_date,
                "amount": amount,
                "currency": currency,
                "merchant_name": merchant_name,
                "transaction_name": transaction_name,
                "status": status,
                "account_id": account_id,
                "last_four": account_info['last_four'],
                "account_type": account_info['account_type'],
                "institution_name": account_info['institution_name'],
                "cardholder": cardholder,
                "raw_data": txn  # Keep raw for debugging
            }
            
            processed_transactions.append(processed_txn)
        
        return processed_transactions
        
    except Exception as e:
        # Check if rate limited
        if "429" in str(e) or "rate" in str(e).lower():
            logger.warning(f"Rate limited for account {account_id}: {e}")
            return None
        else:
            logger.error(f"Error fetching transactions for {account_id}: {e}")
            raise


def create_notion_transaction(notion, data_source_id, transaction, owner):
    """Create a transaction page in Notion."""
    try:
        # Map account type to select option
        account_type_mapping = {
            "CACC": "Current Account",
            "SVGS": "Savings Account",
            "CARD": "Credit Card"
        }
        account_type = account_type_mapping.get(
            transaction['account_type'], 
            "Current Account"
        )
        
        # Build properties
        properties = {
            "Transaction Name": {
                "title": [
                    {"text": {"content": transaction['transaction_name']}}
                ]
            },
            "Transaction Id": {
                "rich_text": [
                    {"text": {"content": transaction['transaction_id']}}
                ]
            },
            "Merchant Name": {
                "rich_text": [
                    {"text": {"content": transaction['merchant_name']}}
                ]
            },

            "Transaction Date": {
                "date": {"start": transaction['booking_date']}
            },
            "Amount": {
                "number": transaction['amount']
            },
            "Institution": {
                "select": {"name": transaction['institution_name']}
            },
            "Account Type": {
                "select": {"name": account_type}
            }
        }
        
        # Add cardholder - use detected cardholder for cards, otherwise owner
        if transaction.get('cardholder'):
            properties["Cardholder"] = {
                "select": {"name": transaction['cardholder']}
            }
        elif owner and owner != "Unknown":
            properties["Cardholder"] = {
                "select": {"name": owner}
            }
        
        # Create page
        response = notion.pages.create(
            parent={
                "type": "data_source_id",
                "data_source_id": data_source_id
            },
            properties=properties
        )
        
        logger.info(f"Created Notion page: {transaction['transaction_name']} - {transaction['currency']}{transaction['amount']}")
        return response
        
    except Exception as e:
        logger.error(f"Error creating Notion transaction: {e}")
        logger.error(f"Transaction data: {transaction}")
        raise


def sync_transactions(dry_run=False, specific_account=None, test_data_file=None):
    """Main sync function."""
    logger.info("=" * 50)
    logger.info("Starting Transaction Sync")
    
    # Load test data if provided
    test_data_response = None
    if test_data_file:
        logger.info(f"TEST DATA MODE - Loading from {test_data_file}")
        try:
            with open(test_data_file, 'r') as f:
                test_data_response = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load test data: {e}")
            return
    
    # Initialize Notion client
    notion = Client(
        auth=NOTION_API_KEY,
        notion_version=NOTION_VERSION
    )
    
    # Load metadata
    metadata = load_gc_metadata()
    synced_tracking = load_synced_transactions()
    
    total_accounts = 0
    total_new_transactions = 0
    total_updated_transactions = 0
    total_skipped = 0
    
    # Iterate through all requisitions
    for req_id, req_data in metadata.items():
        accounts = req_data.get("accounts", [])
        owner = req_data.get("owner", "Unknown")
        
        for account in accounts:
            account_id = account.get("account_id")
            institution_name = account.get("institution_name")
            
            # Skip if specific account requested and this isn't it
            if specific_account and account_id != specific_account:
                continue
            
            # Skip if sync disabled
            if not account.get("sync_enabled", True):
                logger.info(f"Skipping {institution_name} ****{account['last_four']} (sync disabled)")
                continue
            
            # Get data source for this owner
            data_source_id = get_data_source_for_owner(owner)
            if not data_source_id:
                logger.warning(f"Skipping account for {owner} - no data source configured")
                continue
            
            total_accounts += 1
            
            logger.info(f"Processing {institution_name} ****{account['last_four']}")
            
            # Fetch transactions
            transactions = fetch_transactions_for_account(account_id, account, test_data_response)
            
            if transactions is None:
                logger.warning(f"Rate limited, skipping {account['last_four']}")
                continue
            
            # Update last API call time
            account['last_api_call'] = datetime.now().isoformat()
            
            # Initialize account tracking if needed
            if account_id not in synced_tracking:
                synced_tracking[account_id] = {}
            
            # Process each transaction
            for txn in transactions:
                txn_id = txn['transaction_id']
                txn_status = txn['status']
                
                # Check if already synced
                if txn_id in synced_tracking[account_id]:
                    # Check if status changed from pending to booked
                    previous_status = synced_tracking[account_id][txn_id].get('status')
                    
                    if previous_status == 'pending' and txn_status == 'booked':
                        logger.info(f"Transaction {txn_id} status changed: pending → booked")
                        total_updated_transactions += 1
                        
                        # Update in Notion (future: update page status)
                        if not dry_run:
                            synced_tracking[account_id][txn_id]['status'] = 'booked'
                            synced_tracking[account_id][txn_id]['updated_at'] = datetime.now().isoformat()
                    else:
                        # Already synced, no change
                        total_skipped += 1
                        continue
                else:
                    # New transaction
                    logger.info(f"New transaction: {txn['transaction_name']} - {txn['currency']}{txn['amount']}")
                    total_new_transactions += 1
                    
                    # Add to Notion
                    if not dry_run:
                        try:
                            create_notion_transaction(notion, data_source_id, txn, owner)
                            
                            # Track as synced
                            synced_tracking[account_id][txn_id] = {
                                'status': txn_status,
                                'synced_at': datetime.now().isoformat(),
                                'booking_date': txn['booking_date'],
                                'amount': txn['amount'],
                                'notion_page_id': None  # Could store page ID if needed
                            }
                        except Exception as e:
                            logger.error(f"Failed to sync transaction {txn_id}: {e}")
                            continue
            
            # Update last synced time
            account['last_synced'] = datetime.now().isoformat()
    
    # Save updated metadata and tracking
    if not dry_run:
        save_gc_metadata(metadata)
        save_synced_transactions(synced_tracking)
    
    logger.info(f"Sync complete: {total_accounts} accounts processed")
    logger.info(f"  New: {total_new_transactions}")
    logger.info(f"  Updated: {total_updated_transactions}")
    logger.info(f"  Skipped: {total_skipped}")
    logger.info("=" * 50)


def main():
    """Main execution."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Sync bank transactions to Notion')
    parser.add_argument('--dry-run', action='store_true', help='Run without syncing to Notion')
    parser.add_argument('--account-id', help='Sync specific account only')
    parser.add_argument('--test-data', help='Use test data from JSON file (no API calls)')
    
    args = parser.parse_args()
    
    if args.dry_run:
        logger.info("DRY RUN MODE - No changes will be made")
    
    if args.test_data:
        logger.info(f"Using test data from: {args.test_data}")
    
    try:
        sync_transactions(
            dry_run=args.dry_run, 
            specific_account=args.account_id,
            test_data_file=args.test_data
        )
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    main()