"""
Banking transaction specific Notion property mapping
Uses generic notion_loader for actual page creation

This module handles the banking-specific logic for Notion:
- Maps owner names to data source IDs
- Converts enriched transaction data to Notion property format
- Calls the generic loader to do the actual creation

Other projects (recipes, etc.) would have their own adapters.
"""
import sys
from pathlib import Path

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from notion_handlers.notion_config import DATA_SOURCES
from notion_handlers.notion_loader import create_page_in_data_source  # Generic loader!
from .transaction_config import (
    logger,
    OWNER_TO_DATA_SOURCE,
    ACCOUNT_TYPE_MAPPING
)


# ============================================================================
# DATA SOURCE ROUTING
# ============================================================================

def get_data_source_for_owner(owner):
    """
    Get the data source ID based on account owner.
    
    Routes transactions to correct Notion database:
    - Anthony/Josephine → Personal database
    - Business → Business database
    - Children → Children's database
    
    Args:
        owner: Owner name from metadata (e.g., "Anthony", "Business")
        
    Returns:
        Data source UUID string, or None if not configured
    """
    # Look up the data source key for this owner
    data_source_key = OWNER_TO_DATA_SOURCE.get(owner)
    if not data_source_key:
        logger.error(f"No data source mapping for owner: {owner}")
        return None
    
    # Look up the actual UUID from notion_config
    data_source_id = DATA_SOURCES.get(data_source_key)
    if not data_source_id:
        logger.warning(f"Data source not configured for key: {data_source_key}")
        return None
    
    return data_source_id


# ============================================================================
# NOTION PROPERTY MAPPING
# ============================================================================

def map_transaction_to_notion_properties(transaction, owner):
    """
    Map enriched transaction to Notion property format.
    
    Converts our enriched transaction dict into the specific JSON format
    that Notion's API expects for properties.
    
    Args:
        transaction: Enriched transaction dict
        owner: Account owner name
        
    Returns:
        Dict of Notion properties in API format
    """
    # Map account type code to display name
    account_type = ACCOUNT_TYPE_MAPPING.get(
        transaction['account_type'],
        "Current Account"  # Default if unknown type
    )
    
    # Build properties dict in Notion API format
    properties = {
        # Title property (transaction description)
        "Transaction Name": {
            "title": [
                {"text": {"content": transaction['transaction_name']}}
            ]
        },
        
        # Transaction ID (for deduplication)
        "Transaction Id": {
            "rich_text": [
                {"text": {"content": transaction['transaction_id']}}
            ]
        },
        
        # Merchant name
        "Merchant Name": {
            "rich_text": [
                {"text": {"content": transaction['merchant_name']}}
            ]
        },
        
        # Transaction date
        "Transaction Date": {
            "date": {"start": transaction['booking_date']}
        },
        
        # Amount (can be negative for debits)
        "Amount": {
            "number": transaction['amount']
        },
        
        # Institution (bank name)
        "Institution": {
            "select": {"name": transaction['institution_name']}
        },
        
        # Account type (Current Account, Credit Card, etc.)
        "Account Type": {
            "select": {"name": account_type}
        }
    }
    
    # ========================================
    # ADD STATUS (CONDITIONAL)
    # ========================================
    
    # Status (either Cleared or Pending, for Credit Cards only)
    if transaction.get('account_type') == "CARD":
        properties["Status"] = {
            "select": {"name": transaction['payment_status']} # Using transformed 'Payment Status', leaving original 'Status' untouched
        }

    
    # ========================================
    # ADD CARDHOLDER (CONDITIONAL)
    # ========================================
    
    # For credit cards, use detected cardholder
    if transaction.get('cardholder'):
        properties["Cardholder"] = {
            "select": {"name": transaction['cardholder']}
        }
    # For other accounts, use the account owner
    elif owner and owner != "Unknown":
        properties["Cardholder"] = {
            "select": {"name": owner}
        }
    
    # ========================================
    # ADD CATEGORY (FUTURE ENHANCEMENT)
    # ========================================
    
    # If category was detected, add it
    if transaction.get('category'):
        properties["Category"] = {
            "select": {"name": transaction['category']}
        }
    
    return properties


# ============================================================================
# PAGE CREATION
# ============================================================================

def create_transaction_page(transaction, owner, dry_run=False):
    """
    Create a transaction page in Notion with category icon.
    
    This is the main entry point for creating transaction pages.
    It handles routing, mapping, and calling the generic loader.
    
    Args:
        transaction: Enriched transaction dict
        owner: Account owner name
        dry_run: If True, log what would happen but don't create
        
    Returns:
        Notion API response dict, or None if skipped
    """
    # ========================================
    # ROUTE TO CORRECT DATA SOURCE
    # ========================================
    
    data_source_id = get_data_source_for_owner(owner)
    if not data_source_id:
        logger.warning(f"Skipping transaction for {owner} - no data source configured")
        return None
    
    # ========================================
    # MAP TO NOTION FORMAT
    # ========================================
    
    properties = map_transaction_to_notion_properties(transaction, owner)
    
    # ========================================
    # GET ICON FROM TRANSACTION
    # ========================================
    
    icon = transaction.get('icon')  # ADD THIS LINE
    
    # ========================================
    # DRY RUN MODE
    # ========================================
    
    if dry_run:
        logger.info(f"[DRY RUN] Would create: {transaction['transaction_name']} - {transaction['currency']}{transaction['amount']}")
        return None
    
    # ========================================
    # CREATE PAGE USING GENERIC LOADER
    # ========================================
    
    # Call the generic loader with icon parameter
    response = create_page_in_data_source(data_source_id, properties, icon=icon)  # ADD icon=icon
    
    # Log success
    logger.info(f"Created Notion page: {transaction['transaction_name']} - {transaction['currency']}{transaction['amount']}")
    
    return response


# ============================================================================
# UPDATE PAGE IF VALUES IN EXISTING SYNCED TRANSACTION HAVE UPDATED
# ============================================================================

def update_transaction_page(page_id, status):
    """
    Update an existing transaction page (e.g., pending → booked).
    
    Args:
        page_id: Notion page ID to update
        status: New status value
        
    Returns:
        Notion API response dict
    """
    from notion_handlers.notion_loader import get_notion_client
    
    try:
        notion = get_notion_client()
        
        # Update just the status property
        response = notion.pages.update(
            page_id=page_id,
            properties={
                "Status": {
                    "select": {"name": status}
                }
            }
        )
        
        logger.info(f"Updated page {page_id} status to {status}")
        return response
        
    except Exception as e:
        logger.error(f"Error updating Notion page {page_id}: {e}")
        raise