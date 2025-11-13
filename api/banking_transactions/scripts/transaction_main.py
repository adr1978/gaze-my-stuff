"""
Main orchestrator for GoCardless → Notion transaction sync
Entry point for cron jobs and manual execution

This is the main entry point. It orchestrates the entire ETL pipeline:
1. EXTRACT - Get accounts and fetch transactions from GoCardless
2. TRANSFORM - Enrich and process the transaction data
3. LOAD - Create pages in Notion

Run with: python transaction_main.py [--dry-run] [--test-data file.json]
"""
import argparse
import json
from datetime import datetime
from pathlib import Path
import sys

# Add to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Use relative imports (now in scripts folder)
from .transaction_config import logger
from .transaction_extract import (
    get_all_accounts_to_sync,
    fetch_raw_transactions,
    load_gc_metadata,
    save_gc_metadata,
    load_synced_transactions,
    save_synced_transactions
)
from .transaction_transform import transform_transactions
from .transaction_notion_adapter import create_transaction_page, update_transaction_page


def sync_transactions(dry_run=False, specific_account=None, test_data_file=None):
    """
    Main sync orchestration function.
    
    This function coordinates the entire sync process:
    - Loads tracking data
    - Gets accounts to sync
    - For each account:
      - Fetches raw transactions
      - Transforms them
      - Creates Notion pages for new ones
      - Updates tracking
    - Saves updated tracking data
    
    Args:
        dry_run: If True, process but don't create Notion pages or update files
        specific_account: If provided, only sync this account ID
        test_data_file: If provided, use test data instead of GoCardless API
    """
    logger.info("=" * 50)
    logger.info("Starting Transaction Sync")
    
    # ========================================
    # LOAD TEST DATA (IF PROVIDED)
    # ========================================
    
    test_data_response = None
    if test_data_file:
        logger.info(f"TEST DATA MODE - Loading from {test_data_file}")
        try:
            with open(test_data_file, 'r') as f:
                test_data_response = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load test data: {e}")
            return
    
    # ========================================
    # LOAD TRACKING DATA
    # ========================================
    
    # Load GoCardless metadata (accounts, owners, sync status)
    metadata = load_gc_metadata()
    
    # Load synced transactions tracker (prevents duplicates)
    synced_tracking = load_synced_transactions()
    
    # ========================================
    # INITIALIZE COUNTERS
    # ========================================
    
    total_accounts = 0
    total_new_transactions = 0
    total_updated_transactions = 0
    total_skipped = 0
    
    # ========================================
    # GET ACCOUNTS TO SYNC
    # ========================================
    
    # Get list of accounts that should be synced
    # This respects sync_enabled flags and specific_account filter
    accounts_to_sync = get_all_accounts_to_sync(specific_account)
    
    # ========================================
    # PROCESS EACH ACCOUNT
    # ========================================
    
    for req_id, owner, account in accounts_to_sync:
        # Extract account info for logging
        account_id = account.get("account_id")
        institution_name = account.get("institution_name")
        last_four = account.get("last_four")
        
        total_accounts += 1
        logger.info(f"Processing {institution_name} ****{last_four}")
        
        # ========================================
        # EXTRACT: FETCH RAW TRANSACTIONS
        # ========================================
        
        raw_response = fetch_raw_transactions(account_id, test_data_response)
        
        # Check if we hit rate limit
        if raw_response is None:
            logger.warning(f"Rate limited, skipping {last_four}")
            continue
        
        # Update last API call timestamp (for rate limiting tracking)
        account['last_api_call'] = datetime.now().isoformat()
        
        # ========================================
        # TRANSFORM: ENRICH TRANSACTIONS
        # ========================================
        
        transactions = transform_transactions(raw_response, account)
        
        # Initialize tracking dict for this account if needed
        if account_id not in synced_tracking:
            synced_tracking[account_id] = {}
        
        # ========================================
        # LOAD: PROCESS EACH TRANSACTION
        # ========================================
        
        for txn in transactions:
            txn_id = txn['transaction_id']
            txn_status = txn['status']
            
            # Check if we've already synced this transaction
            if txn_id in synced_tracking[account_id]:
                # Already synced - check if status changed
                previous_status = synced_tracking[account_id][txn_id].get('status')
                
                # Detect pending → booked status change
                if previous_status == 'pending' and txn_status == 'booked':
                    logger.info(f"Transaction {txn_id} status changed: pending → booked")
                    total_updated_transactions += 1
                    
                    # Update the Notion page
                    if not dry_run:
                        notion_page_id = synced_tracking[account_id][txn_id].get('notion_page_id')
                        
                        if notion_page_id:
                            try:
                                # Update the page in Notion
                                update_transaction_page(
                                    page_id=notion_page_id,
                                    status="Cleared" # Force this to be 'Cleared' rather than 'Booked' - for Notion db alignment
                                )
                                
                                # Update tracking
                                synced_tracking[account_id][txn_id]['status'] = 'booked'
                                synced_tracking[account_id][txn_id]['updated_at'] = datetime.now().isoformat()
                                
                            except Exception as e:
                                logger.error(f"Failed to update transaction {txn_id}: {e}")
                        else:
                            logger.warning(f"Cannot update {txn_id} - no Notion page ID stored")
                else:
                    # No change - skip this transaction
                    total_skipped += 1
                    continue
            else:
                # New transaction - hasn't been synced yet
                logger.info(f"New transaction: {txn['transaction_name']} - {txn['currency']}{txn['amount']}")
                total_new_transactions += 1
                
                # Create page in Notion
                try:
                    response = create_transaction_page(txn, owner, dry_run)  # Capture response!
                    
                    # Track as synced (if not dry run)
                    if not dry_run:
                        # Extract page ID from response
                        notion_page_id = response.get('id') if response else None
                        
                        synced_tracking[account_id][txn_id] = {
                            'status': txn_status,
                            'synced_at': datetime.now().isoformat(),
                            'booking_date': txn['booking_date'],
                            'amount': txn['amount'],
                            'notion_page_id': notion_page_id  # Store the ID of the page just created
                        }
                        
                        if notion_page_id:
                            logger.info(f"Stored page ID: {notion_page_id}")
                        else:
                            logger.warning(f"No page ID returned for transaction {txn_id}")
                            
                except Exception as e:
                    logger.error(f"Failed to sync transaction {txn_id}: {e}")
                    continue
        
        # Update last synced timestamp for this account
        account['last_synced'] = datetime.now().isoformat()
    
    # ========================================
    # SAVE UPDATED TRACKING DATA
    # ========================================
    
    if not dry_run:
        # Save updated metadata (last_synced times, etc.)
        save_gc_metadata(metadata)
        
        # Save updated synced transactions tracker
        save_synced_transactions(synced_tracking)
    
    # ========================================
    # LOG SUMMARY
    # ========================================
    
    logger.info(f"Sync complete: {total_accounts} accounts processed")
    logger.info(f"  New: {total_new_transactions}")
    logger.info(f"  Updated: {total_updated_transactions}")
    logger.info(f"  Skipped: {total_skipped}")
    logger.info("=" * 50)


def main():
    """
    Main entry point for command-line execution.
    
    Parses command-line arguments and calls sync_transactions().
    """
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Sync bank transactions to Notion')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Run without syncing to Notion (test mode)')
    parser.add_argument('--account-id', 
                       help='Sync specific account only (by GoCardless account ID)')
    parser.add_argument('--test-data', 
                       help='Use test data from JSON file (no API calls)')
    
    args = parser.parse_args()
    
    # Log mode information
    if args.dry_run:
        logger.info("DRY RUN MODE - No changes will be made")
    
    if args.test_data:
        logger.info(f"Using test data from: {args.test_data}")
    
    # Run the sync
    try:
        sync_transactions(
            dry_run=args.dry_run,
            specific_account=args.account_id,
            test_data_file=args.test_data
        )
    except Exception as e:
        # Log the error and print full traceback
        logger.error(f"Sync failed: {e}")
        import traceback
        traceback.print_exc()
        raise


# Entry point when run directly
if __name__ == "__main__":
    main()