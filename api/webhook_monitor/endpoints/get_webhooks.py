"""
Webhook Retrieval Endpoint

Provides API endpoint to fetch webhook logs with optional filtering.
"""

from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from ..scripts.logger import get_webhooks_since

router = APIRouter()


@router.get("/webhooks")
async def get_webhooks(
    last_checked: Optional[str] = Query(None, description="ISO timestamp to get webhooks since")
) -> Dict[str, Any]:
    """
    Retrieve webhook logs, optionally filtered by timestamp.
    
    Args:
        last_checked: Optional ISO format timestamp to only return webhooks newer than this
    
    Returns:
        Dictionary containing webhooks list and metadata
    """
    webhooks = get_webhooks_since(last_checked)
    
    return {
        "webhooks": webhooks,
        "count": len(webhooks),
        "last_updated": webhooks[0]["timestamp"] if webhooks else None
    }
