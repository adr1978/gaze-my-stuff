"""
Whisk API Client (Read-Only/Fetch)
Handles fetching recipes from Whisk for synchronization.
"""
import logging
import requests
from .whisk_auth import get_access_token

logger = logging.getLogger("whisk_importer")

def fetch_whisk_recipes(limit=100, offset=0):
    """
    Fetches a list of recipes from the user's Whisk account.
    """
    token_data = get_access_token()
    if not token_data or not token_data.get('access_token'):
        raise Exception("Failed to authenticate with Whisk")
    
    access_token = token_data['access_token']
    
    # Endpoint for user's recipes
    # Note: Whisk API endpoints can vary, using the standard list endpoint
    url = "https://graph.whisk.com/v1/me/recipes"
    
    params = {
        "limit": limit,
        "offset": offset,
        "sort": "date_added" # Or 'updated'
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}", # Whisk often uses Bearer here
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.HTTPError as e:
        logger.error(f"Whisk Fetch Error: {e.response.text}")
        raise e