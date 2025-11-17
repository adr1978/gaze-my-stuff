"""
API Monitor Logs Endpoint

Returns detailed logs of API sync runs across all platforms.
"""

from fastapi import APIRouter
import json
import os

router = APIRouter()

@router.get("/logs")
async def get_monitor_logs():
    """
    Returns detailed logs of API sync runs.
    
    Response includes array of run objects with:
    - run_id: Unique identifier for the sync run
    - timestamp: When the run started
    - category: Platform category (lego, whisk, plex_movies, etc.)
    - status: Overall status (success, partial_success, failed)
    - duration_ms: Total duration in milliseconds
    - items_processed: Array of individual items synced
    
    Returns:
        list: Array of sync run objects
    """
    data_path = "api/api_monitor/data/sample_data.json"
    
    if os.path.exists(data_path):
        with open(data_path, "r") as f:
            data = json.load(f)
            return data.get("runs", [])
    
    # Fallback
    return []
