# api/banking_connections/endpoints/account_routes.py

import logging
from fastapi import APIRouter, HTTPException
# Correct relative import for the client file
from ..scripts.gc_client import load_gc_metadata, save_gc_metadata 

# --- Configure logging ---
logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/gc",  # All routes in this file will start with /api/gc
    tags=["gocardless-accounts"],
)

# --- Endpoints for Account Management ---

@router.post("/toggle-sync/{requisition_id}/{account_id}")
async def toggle_sync(requisition_id: str, account_id: str):
    """API for toggling transaction sync on a specific account."""
    # (Content from the original routes.py function: toggle_sync)
    logger.info(f"API call: POST /api/gc/toggle-sync/{requisition_id}/{account_id}")
    try:
        metadata = load_gc_metadata()
        if requisition_id not in metadata:
            raise HTTPException(status_code=404, detail="Requisition not found")
        
        account_found = False
        new_status = False
        for account in metadata[requisition_id].get("accounts", []):
            if account.get("account_id") == account_id:
                # Toggle the status
                account["sync_enabled"] = not account.get("sync_enabled", False)
                new_status = account["sync_enabled"]
                account_found = True
                break
        
        if not account_found:
            raise HTTPException(status_code=404, detail="Account not found")
            
        save_gc_metadata(metadata)
        status_str = "ENABLED" if new_status else "DISABLED"
        logger.info(f"Sync for account {account_id} set to {status_str}")
        return {"success": True, "message": f"Sync {status_str} for account {account_id}"}

    except Exception as e:
        logger.error(f"Failed in toggle_sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))