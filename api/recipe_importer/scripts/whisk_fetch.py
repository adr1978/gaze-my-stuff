"""
Whisk API Client (Read-Only/Fetch)
Handles fetching recipes from Whisk for synchronization.
"""
import logging
import requests
from .whisk_auth import get_access_token

logger = logging.getLogger("whisk_importer")

def _get_token_if_missing(access_token):
    """Helper to get token if not provided."""
    if access_token:
        return access_token
        
    token_data = get_access_token()
    if not token_data or not token_data.get('access_token'):
        raise Exception("Failed to authenticate with Whisk")
    return token_data['access_token']

def _make_request_with_retry(method, url, headers, params=None):
    """
    Executes a request and refreshes the token on 401 Unauthorized.
    """
    try:
        response = requests.request(method, url, headers=headers, params=params)
        response.raise_for_status()
        return response
    except requests.HTTPError as e:
        # If 401 Unauthorized, try to refresh token and retry ONCE
        if e.response.status_code == 401:
            logger.warning("⚠️ Whisk Token expired (401). Refreshing...")
            
            # Force a fresh token fetch
            # Note: get_access_token handles the login flow
            new_token_data = get_access_token()
            if new_token_data and new_token_data.get('access_token'):
                new_token = new_token_data['access_token']
                headers["Authorization"] = f"Bearer {new_token}"
                
                # Retry
                logger.info("🔄 Retrying with new token...")
                response = requests.request(method, url, headers=headers, params=params)
                response.raise_for_status()
                return response
            else:
                logger.error("❌ Failed to refresh token.")
                raise e
        else:
            raise e

def fetch_whisk_list(limit=100, after_cursor=None, access_token=None):
    """
    Fetches a page of recipes from Whisk API v2.
    """
    token = _get_token_if_missing(access_token)
    url = "https://api.whisk.com/recipe/v2"
    
    params = {"paging.limit": limit}
    if after_cursor:
        params["paging.cursors.after"] = after_cursor

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = _make_request_with_retry('GET', url, headers, params)
        return response.json()
    except requests.HTTPError as e:
        logger.error(f"Whisk Fetch Error: {e.response.text}")
        raise e

def fetch_recipe_details(recipe_id, access_token=None):
    """
    Fetches full details (including instructions) for a single recipe.
    """
    token = _get_token_if_missing(access_token)
    
    url = "https://api.whisk.com/recipe/v2/get"
    params = {
        "id": recipe_id,
        "fields": ["RECIPE_FIELD_INSTRUCTIONS", "RECIPE_FIELD_SAVED"]
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = _make_request_with_retry('GET', url, headers, params)
        return response.json()
    except Exception as e:
        logger.error(f"Failed to fetch details for {recipe_id}: {e}")
        return {}

def fetch_recipe_review_status(recipe_id, access_token=None):
    """
    Checks if a recipe has been 'made' by fetching its review status.
    Returns True if review data exists (implies 'made'), False if empty.
    """
    token = _get_token_if_missing(access_token)
    
    # Endpoint logic from whisk2notion.txt
    url = f"https://api.whisk.com/v2/post/recipe_review/{recipe_id}/reviews"
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = _make_request_with_retry('GET', url, headers)
        data = response.json()
        
        # If empty dict/list -> Not Made
        # If data exists -> Made
        if not data:
            return False
        
        # Check if 'posts' key exists and has items (based on whisk2notion structure)
        if isinstance(data, dict) and 'posts' in data and len(data['posts']) > 0:
            return True
            
        # Fallback if structure is just empty object {}
        if isinstance(data, dict) and len(data) == 0:
            return False

        return False 
        
    except Exception as e:
        logger.warning(f"Failed to fetch review status for {recipe_id}: {e}")
        return False