"""
Generic Notion page creation utilities
Reusable across projects (recipes, transactions, etc)

This module provides generic functions for creating pages in Notion data sources.
It's completely project-agnostic - any project can import and use these functions.
"""
import logging
from api.notion_handlers.notion_config import NOTION_API_KEY, NOTION_VERSION
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


def create_page_in_data_source(data_source_id, properties, icon=None):
    """
    Generic function to create a page in a Notion data source.
    
    Args:
        data_source_id: UUID of the data source (not database ID!)
        properties: Dict of Notion property values
        icon: Optional external icon URL (e.g., "452")
              If None, no icon is set.
        
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
        
        # Add icon if provided (always external URL)
        if icon:
            create_params["icon"] = {
                "type": "external",
                "external": {
                    "url": icon
                }
            }
            logger.info(f"Setting external icon: {icon}")
        else:
            logger.info("No icon provided")
        
        # Create the page
        response = notion.pages.create(**create_params)
        
        return response
        
    except Exception as e:
        logger.error(f"Error creating Notion page: {e}")
        logger.error(f"Properties: {properties}")
        if icon:
            logger.error(f"Icon that failed: {icon}")
        raise


def update_page_properties(page_id, properties):
    """
    Update properties of an existing Notion page.
    
    Args:
        page_id: UUID of the page to update
        properties: Dict of Notion properties to update
        
    Returns:
        Notion API response dict
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
    
    Useful for bulk imports. Continues on errors so one bad page
    doesn't stop the whole batch.
    
    Args:
        data_source_id: UUID of the data source
        pages_properties: List of property dicts (one per page)
        dry_run: If True, log what would happen but don't create
        
    Returns:
        Dict with results: {
            "success": count,
            "failed": count,
            "errors": [error messages]
        }
    """
    results = {
        "success": 0,
        "failed": 0,
        "errors": []
    }
    
    # Process each page
    for props in pages_properties:
        if dry_run:
            # In dry run mode, just log what we would do
            logger.info(f"[DRY RUN] Would create page")
            results["success"] += 1
            continue
        
        try:
            # Actually create the page
            create_page_in_data_source(data_source_id, props)
            results["success"] += 1
        except Exception as e:
            # Track failures but continue with remaining pages
            results["failed"] += 1
            results["errors"].append(str(e))
    
    return results
