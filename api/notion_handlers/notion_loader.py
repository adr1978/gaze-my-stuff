"""
Generic Notion page creation utilities
Reusable across projects (recipes, transactions, etc)

This module provides generic functions for creating pages in Notion data sources.
It's completely project-agnostic - any project can import and use these functions.
"""
import logging
import json
from notion_handlers.notion_config import NOTION_API_KEY, NOTION_VERSION
from notion_client import Client
# Import the new rate limiter
from .rate_limiter import rate_limit

logger = logging.getLogger(__name__)

def _log_debug_info(client, data_source_id):
    """Logs token status and request headers for debugging"""
    # 1. Check Token
    if not NOTION_API_KEY:
        logger.error("❌ NOTION_API_KEY is missing or None! Check .env path.")

    # 2. Check Headers (Client constructs them internally, so we simulate what it sends)
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY[:4]}...[REDACTED]" if NOTION_API_KEY else "Bearer None",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json"
    }
    # logger.info(f"📡 Request Headers (Simulated): {json.dumps(headers, indent=2)}")
    # logger.info(f"🎯 Target Data Source: {data_source_id}")


def get_notion_client():
    """
    Get initialized Notion client.
    """
    return Client(
        auth=NOTION_API_KEY,
        notion_version=NOTION_VERSION
    )

@rate_limit
def create_page_in_data_source(data_source_id, properties, children=None, icon=None, cover=None):
    """
    Generic function to create a page in a Notion data source.
    Now supports File Objects (dicts) for icon and cover.
    """
    notion = get_notion_client()
    # _log_debug_info(notion, data_source_id) # Uncomment for deep debugging

    try:
        # Build create params
        create_params = {
            "parent": {
                "type": "data_source_id",
                "data_source_id": data_source_id
            },
            "properties": properties
        }
        
        # Add optional content blocks (children)
        if children:
            create_params["children"] = children

        # Handle Icon
        if icon:
            if isinstance(icon, dict):
                # Pass file object directly (e.g. type: "file_upload" or "file")
                create_params["icon"] = icon
            else:
                # Legacy behavior: Wrap string in external url object
                create_params["icon"] = {
                    "type": "external",
                    "external": {
                        "url": icon
                    }
                }
                logger.info(f"Setting external icon: {icon}")
            
        # Handle Cover
        if cover:
            if isinstance(cover, dict):
                # Pass file object directly (e.g. type: "file_upload" or "file")
                create_params["cover"] = cover
            else:
                # Legacy behavior: Wrap string in external url object
                create_params["cover"] = {
                    "type": "external",
                    "external": {
                        "url": cover
                    }
                }
                logger.info(f"Setting external cover: {cover}")
        
        # logger.info(f"🔍 NOTION REQUEST BODY:\n{json.dumps(create_params, indent=2)}")
        
        # Create the page
        response = notion.pages.create(**create_params)
        
        # logger.info(f"✅ NOTION RESPONSE:\n{json.dumps(response, indent=2)}")
        return response
        
    except Exception as e:
        logger.error(f"Error creating Notion page: {e}")
        logger.error(f"Properties: {properties}")
        if icon:
            logger.error(f"Icon context: {icon}")
        
        # Helpful debug logging for block structure errors
        if children and len(children) > 0:
            logger.error(f"Failed with children blocks. First block: {children[0]}")
            
        raise

@rate_limit
def update_page_properties(page_id, properties=None, cover=None, icon=None):
    """
    Update properties of an existing Notion page.
    Updated to accept cover/icon updates.
    """
    try:
        notion = get_notion_client()
        
        update_params = {"page_id": page_id}
        
        if properties:
            update_params["properties"] = properties
            
        if cover:
            if isinstance(cover, dict):
                update_params["cover"] = cover
            else:
                update_params["cover"] = {"type": "external", "external": {"url": cover}}
                
        if icon:
            if isinstance(icon, dict):
                update_params["icon"] = icon
            else:
                update_params["icon"] = {"type": "external", "external": {"url": icon}}

        response = notion.pages.update(**update_params)
        return response
        
    except Exception as e:
        logger.error(f"Error updating Notion page {page_id}: {e}")
        raise

@rate_limit
def append_block_children(block_id, children):
    """
    Appends block children to an existing block (or page).
    Used for adding content to the bottom of a recipe page.
    """
    try:
        notion = get_notion_client()
        response = notion.blocks.children.append(
            block_id=block_id,
            children=children
        )
        return response
    except Exception as e:
        logger.error(f"Error appending blocks to {block_id}: {e}")
        raise

@rate_limit
def archive_page(page_id):
    """
    Archive (delete) a page in Notion.
    """
    try:
        notion = get_notion_client()
        response = notion.pages.update(page_id=page_id, archived=True)
        logger.info(f"🗑️ Archived Notion page: {page_id}")
        return response
    except Exception as e:
        logger.error(f"Error archiving Notion page {page_id}: {e}")
        raise

def create_pages_batch(data_source_id, pages_properties, dry_run=False):
    """
    Create multiple pages in a data source with error tracking.
    """
    results = {
        "success": 0,
        "failed": 0,
        "errors": []
    }
    
    for props in pages_properties:
        if dry_run:
            logger.info(f"[DRY RUN] Would create page")
            results["success"] += 1
            continue
        
        try:
            create_page_in_data_source(data_source_id, props)
            results["success"] += 1
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(str(e))
    
    return results