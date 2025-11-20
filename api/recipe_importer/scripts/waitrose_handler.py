"""
Waitrose Recipe Processing Handler

Orchestrates the full pipeline: validate URL → scrape → authenticate → upload to Whisk
Returns standardized response format for FastAPI endpoint.
"""

from urllib.parse import urlparse
from .waitrose_scraper import scrape_waitrose_recipe
from .whisk_auth import authenticate
from .whisk_create import create_recipe_in_whisk


def process_waitrose_recipe(url: str):
    """
    Process a Waitrose recipe: scrape and upload to Samsung Food / aka Whisk
    
    Args:
        url: Waitrose recipe URL
        
    Returns:
        Tuple of (status_code, response_dict)
    """
    
    if not url:
        return 400, {
            "success": False,
            "steps": {},
            "data": None,
            "error": {"message": "URL is required", "body": {}}
        }
    
    try:
        parsed_url = urlparse(url)
        if not parsed_url.netloc.endswith('waitrose.com'):
            return 400, {
                "success": False,
                "steps": {},
                "data": None,
                "error": {
                    "message": "Invalid URL domain",
                    "body": {"details": f"Only waitrose.com URLs are supported. Received: {parsed_url.netloc}"}
                }
            }
    except Exception as e:
        return 400, {
            "success": False,
            "steps": {},
            "data": None,
            "error": {"message": "Invalid URL format", "body": {"details": str(e)}}
        }
    
    steps = {}
    
    try:
        scraped_data = scrape_waitrose_recipe(url)
        steps["scraping"] = f"✅ Scraped: {scraped_data['name']}"
    except Exception as e:
        return 500, {
            "success": False,
            "steps": {"scraping": "❌ Failed"},
            "data": None,
            "error": {"message": "Scraping error", "body": {"details": str(e)}}
        }
    
    try:
        access_token, token_source = authenticate()
        steps["authentication"] = f"✅ Authenticated ({token_source})"
    except Exception as e:
        error_info = e.error_info if hasattr(e, 'error_info') else {
            "message": "Authentication failed",
            "body": {"details": str(e)}
        }
        return 500, {"success": False, "steps": steps, "data": None, "error": error_info}
    
    try:
        whisk_response = create_recipe_in_whisk(access_token, scraped_data)
        steps["whisk_upload"] = "✅ Uploaded to Samsung Food"
    except Exception as e:
        error_info = e.error_info if hasattr(e, 'error_info') else {
            "message": "Upload failed",
            "body": {"details": str(e)}
        }
        return 500, {"success": False, "steps": steps, "data": None, "error": error_info}
    
    return 200, {
        "success": True,
        "steps": steps,
        "data": {"source_url": url, "whisk_response": whisk_response},
        "error": None
    }