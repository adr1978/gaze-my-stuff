"""
Waitrose Recipe Processing Handler

Handles parsing of Waitrose recipe URLs and extraction of recipe data.
Returns structured JSON to frontend (does NOT upload to Whisk).

This module:
1. Validates the Waitrose URL
2. Scrapes the recipe page
3. Returns structured JSON to frontend

Upload to Whisk is handled separately by the upload endpoint.
"""

import logging
from urllib.parse import urlparse
from .waitrose_scraper import scrape_waitrose_recipe

logger = logging.getLogger(__name__)


def process_waitrose_recipe(url: str):
    """
    Parse a Waitrose recipe URL and return structured JSON.
    
    This function only handles parsing/extraction - it does NOT upload to Whisk.
    The frontend will receive the parsed data and can then upload via the 
    separate upload endpoint.
    
    Args:
        url: Waitrose recipe URL
        
    Returns:
        Tuple of (status_code, response_dict)
    """
    
    # Validate URL is provided
    if not url:
        logger.error("No URL provided")
        return 400, {
            "success": False,
            "data": None,
            "error": {"message": "URL is required", "body": {}}
        }
    
    # Validate URL domain is waitrose.com
    try:
        parsed_url = urlparse(url)
        if not parsed_url.netloc.endswith('waitrose.com'):
            logger.error(f"Invalid domain: {parsed_url.netloc}")
            return 400, {
                "success": False,
                "data": None,
                "error": {
                    "message": "Invalid URL domain",
                    "body": {"details": f"Only waitrose.com URLs are supported. Received: {parsed_url.netloc}"}
                }
            }
    except Exception as e:
        logger.error(f"URL parsing failed: {str(e)}")
        return 400, {
            "success": False,
            "data": None,
            "error": {"message": "Invalid URL format", "body": {"details": str(e)}}
        }
    
    # Scrape the Waitrose recipe page
    try:
        logger.info(f"Scraping Waitrose recipe from: {url}")
        scraped_data = scrape_waitrose_recipe(url)
        logger.info(f"✅ Successfully scraped: {scraped_data['name']}")
        
        # Transform scraped data to frontend format
        # Waitrose scraper returns data in Whisk format, transform to frontend format
        frontend_data = transform_to_frontend_format(scraped_data)
        
        return 200, {
            "success": True,
            "data": frontend_data,
            "error": None
        }
        
    except Exception as e:
        logger.error(f"❌ Scraping failed: {str(e)}")
        return 500, {
            "success": False,
            "data": None,
            "error": {"message": "Scraping error", "body": {"details": str(e)}}
        }


def transform_to_frontend_format(scraped_data: dict) -> dict:
    """
    Transform Waitrose scraped data to frontend JSON format.
    
    The scraper returns data in Whisk-like format with:
    - ingredients as list of dicts: [{"text": "...", "group": "..."}]
    - instructions as list of strings
    
    Frontend expects:
    - title (not name)
    - ingredients as list of strings (for display)
    - imageUrl (not image_url)
    - url (not source_url)
    
    Args:
        scraped_data: Raw data from waitrose_scraper
        
    Returns:
        Dictionary in frontend format
    """
    
    logger.info(f"Transforming scraped data for: {scraped_data.get('name')}")
    
    # Extract ingredients text (preserve groups if present for later Whisk upload)
    ingredients = []
    for ing in scraped_data.get("ingredients", []):
        if isinstance(ing, dict):
            ingredients.append(ing["text"])
        else:
            ingredients.append(str(ing))
    
    # Map fields to frontend format
    frontend_data = {
        "title": scraped_data.get("name", ""),
        "description": scraped_data.get("description", ""),
        "servings": scraped_data.get("servings"),
        "prep_time": scraped_data.get("prep_time"),
        "cook_time": scraped_data.get("cook_time"),
        "ingredients": ingredients,
        "instructions": scraped_data.get("instructions", []),
        "notes": scraped_data.get("cooks_tip"),
        "source": "Waitrose",
        "category": None,  # Will be set by frontend based on user selection
        "imageUrl": scraped_data.get("image_url"),
        "url": scraped_data.get("source_url"),
    }
    
    logger.info("✅ Data transformation complete")
    return frontend_data