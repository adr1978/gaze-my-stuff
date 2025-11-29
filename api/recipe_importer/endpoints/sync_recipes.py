import logging
from fastapi import APIRouter, BackgroundTasks, Request
from ..scripts.recipe_sync import run_sync

logger = logging.getLogger("recipe_importer")

router = APIRouter()

# Helper to extract page ID from Notion webhook payload (Future use)
async def extract_notion_page_id(request: Request):
    try:
        body = await request.json()
        # Notion automations usually send the page object that triggered it.
        # Structure varies, but often { "data": { "id": "..." } } or root level "id"
        # For now we just log it safely.
        # logger.info(f"Webhook Body: {body}") 
        return body.get("data", {}).get("id") # Example extraction
    except Exception:
        return None

@router.post("/webhook/recipes/sync")
async def trigger_sync_webhook(
    background_tasks: BackgroundTasks, 
    request: Request,
    full_sync: bool = False
):
    """
    Webhook endpoint to trigger synchronization.
    URL: /api/recipe/webhook/recipes/sync (Assuming prefix /api/recipe in main.py)
    
    Accepts Notion Automation payload.
    """
    # Try to get the source page ID (if triggered by Notion)
    source_page_id = await extract_notion_page_id(request)
    
    logger.info(f"Received Sync Webhook (Full Sync: {full_sync}, Source Page: {source_page_id})")
    
    # Pass the source page ID to the runner
    background_tasks.add_task(run_sync, full_sync=full_sync, notion_event_page_id=source_page_id)
    
    return {
        "status": "started", 
        "message": "Sync process started in background.",
        "source_page": source_page_id
    }