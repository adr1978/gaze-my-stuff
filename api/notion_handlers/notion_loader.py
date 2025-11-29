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

logger = logging.getLogger(__name__)


def get_notion_client():
    """
    Get initialized Notion client.
    
    Returns a configured Notion client instance that can be used
    to make API calls. Uses credentials from notion_config.
    """
    return Client(
        auth=NOTION_API_KEY,
        notion_version=NOTION_VERSION
    )


def create_page_in_data_source(data_source_id, properties, children=None, icon=None, cover=None):
    """
    Generic function to create a page in a Notion data source.
    
    Args:
        data_source_id: UUID of the data source (not database ID!)
        properties: Dict of Notion property values
        children: Optional list of block objects (page content)
        icon: Optional external icon URL string (e.g. "https://...") OR a Notion File Object (dict)
        cover: Optional external cover image URL string OR a Notion File Object (dict)
        
    Returns:
        Notion API response dict
    """
    try:
        notion = get_notion_client()
        
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
        
        # --- TEMPORARY DEBUG LOGGING ---
        logger.info(f"🔍 NOTION REQUEST BODY:\n{json.dumps(create_params, indent=2)}")
        
        # Create the page
        response = notion.pages.create(**create_params)
        
        # --- TEMPORARY DEBUG LOGGING ---
        logger.info(f"✅ NOTION RESPONSE:\n{json.dumps(response, indent=2)}")
        
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


def update_page_properties(page_id, properties):
    """
    Update properties of an existing Notion page.
    """
    try:
        notion = get_notion_client()
        response = notion.pages.update(
            page_id=page_id,
            properties=properties
        )
        return response
    except Exception as e:
        logger.error(f"Error updating Notion page {page_id}: {e}")
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