import logging
from fastapi import APIRouter, BackgroundTasks, Request
from ..scripts.recipe_sync import run_sync

logger = logging.getLogger("recipe_importer")

router = APIRouter()

# Helper to extract page ID from Notion webhook payload
async def extract_notion_page_id(request: Request):
    try:
        body = await request.json()
        return body.get("data", {}).get("id")
    except Exception:
        return None

@router.post("/webhook/recipes/sync")
async def trigger_sync_webhook(
    background_tasks: BackgroundTasks, 
    request: Request,
    full_sync: bool = False,
    retry_rejected: bool = False  # [FIX] Ensure this is present to capture ?retry_rejected=true
):
    """
    Webhook endpoint to trigger synchronization.
    URL: /api/recipe/webhook/recipes/sync
    """
    # Try to get the source page ID (if triggered by Notion)
    source_page_id = await extract_notion_page_id(request)
    
    logger.info(f"Received Sync Webhook (Full Sync: {full_sync}, Retry Rejected: {retry_rejected}, Source: {source_page_id})")
    
    # Pass arguments to the runner
    background_tasks.add_task(
        run_sync, 
        full_sync=full_sync, 
        retry_rejected=retry_rejected,
        notion_event_page_id=source_page_id
    )
    
    return {
        "status": "started", 
        "message": "Sync process started in background.",
        "config": {
            "full_sync": full_sync,
            "retry_rejected": retry_rejected
        }
    }