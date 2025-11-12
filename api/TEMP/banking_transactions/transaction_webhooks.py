"""
Webhook handlers for Notion database automations

Handles incoming webhooks from Notion when transaction properties change.
Currently supports:
- Category change → Icon update
"""
import sys
from pathlib import Path

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from notion_handlers.notion_loader import get_notion_client
from .transaction_config import logger

# Import the category icon mapping from transform module
from .transaction_transform import CATEGORY_ICONS


def handle_category_change(payload: dict) -> dict:
    """
    Handle category change webhook from Notion.
    
    When a transaction's category is changed in Notion, this updates
    the page icon to match the new category.
    
    Args:
        payload: Webhook payload from Notion automation
        
    Returns:
        Dict with success status and details
    """
    # ========================================
    # LOG WEBHOOK RECEIPT
    # ========================================
    
    logger.info("="*50)
    logger.info("Webhook received: category_change")
    logger.info("="*50)
    
    try:
        # ========================================
        # EXTRACT DATA FROM PAYLOAD
        # ========================================
        
        # Get page ID
        page_id = payload.get('data', {}).get('id')
        if not page_id:
            logger.error("No page ID in webhook payload")
            logger.info("="*50)
            return {
                "success": False,
                "error": "Missing page ID in payload"
            }
        
        logger.info(f"Page: {page_id}")
        
        # Get new category from properties
        properties = payload.get('data', {}).get('properties', {})
        category_prop = properties.get('Category', {})
        category_select = category_prop.get('select', {})
        new_category = category_select.get('name')
        
        if not new_category:
            logger.error("No category value in webhook payload")
            logger.info("="*50)
            return {
                "success": False,
                "page_id": page_id,
                "error": "Missing category value in payload"
            }
        
        logger.info(f"Category changed to: {new_category}")
        
        # ========================================
        # GET ICON FOR NEW CATEGORY
        # ========================================
        
        # Look up icon URL for this category
        icon_url = CATEGORY_ICONS.get(new_category)
        
        if not icon_url:
            logger.warning("No icon mapping found for category")
            logger.info("="*50)
            # Don't fail - just log and return success without updating icon
            return {
                "success": True,
                "page_id": page_id,
                "category": new_category,
                "icon_url": None,
                "message": "No icon mapping for this category"
            }
        
        logger.info(f"Icon URL: {icon_url}")
        
        # ========================================
        # UPDATE NOTION PAGE ICON
        # ========================================
        
        notion = get_notion_client()
        
        # Update the page with new icon
        response = notion.pages.update(
            page_id=page_id,
            icon={
                "type": "external",
                "external": {
                    "url": icon_url
                }
            }
        )
        
        logger.info("Successfully updated page icon")
        logger.info("="*50)
        
        return {
            "success": True,
            "page_id": page_id,
            "category": new_category,
            "icon_url": icon_url,
            "message": "Icon updated successfully"
        }
        
    except Exception as e:
        # Log error but don't raise - fail silently
        logger.error(f"Error processing webhook: {e}")
        logger.error(f"Payload: {payload}")
        logger.info("="*50)
        
        return {
            "success": False,
            "error": str(e)
        }


def route_webhook(webhook_type: str, payload: dict) -> dict:
    """
    Route webhook to appropriate handler based on type.
    
    Args:
        webhook_type: Type of webhook (e.g., 'category_change')
        payload: Webhook payload from Notion
        
    Returns:
        Dict with processing result
    """
    
    if webhook_type == 'category_change':
        return handle_category_change(payload)
    else:
        logger.warning(f"Unknown webhook type: {webhook_type}")
        return {
            "success": False,
            "error": f"Unknown webhook type: {webhook_type}"
        }