import httpx
import json
import logging
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from scripts.banking_data.gc_client import get_nordigen_client, load_gc_metadata, save_gc_metadata
from datetime import datetime, timedelta
from pathlib import Path

# --- Configure logging ---
logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/gc",  # All routes in this file will start with /api/gc
    tags=["gocardless"],
)

#
# Helper function to fetch account details
#
async def fetch_and_store_account_details(requisition_id: str, reference: str, owner: str):
    """
    Fetch account details for all accounts in a requisition and store in metadata.
    Called after successful bank authorization.
    """
    logger.info(f"Fetching account details for req_id: {requisition_id}")
    try:
        client = get_nordigen_client()
        
        requisition = client.requisition.get_requisition_by_id(requisition_id)
        account_ids = requisition.get("accounts", [])
        
        if not account_ids:
            logger.warning(f"No accounts found for requisition {requisition_id}")
            # <-- This is the fix from before (no 'return')
        
        institution_id = requisition.get("institution_id", "Unknown")
        
        # Get institution name
        institution_name = "Unknown Bank"
        try:
            institutions = client.institution.get_institutions(country="GB")
            institution_name = next((i['name'] for i in institutions if i['id'] == institution_id), institution_id)
        except Exception:
            pass # Use default

        accounts_data = []
        for account_id in account_ids:
            try:
                account_details = client.account_api(account_id).get_details()
                account_info = account_details.get("account", {})
                
                cash_account_type = account_info.get("cashAccountType", "UNKNOWN")
                last_four = "XXXX"
                if cash_account_type in ["CACC", "SVGS"]:
                    scan = account_info.get("scan", "")
                    if scan: last_four = scan[-4:]
                elif cash_account_type == "CARD":
                    masked_pan = account_info.get("maskedPan", "")
                    if masked_pan: last_four = masked_pan[-4:]
                
                accounts_data.append({
                    "account_id": account_id,
                    "owner_name": account_info.get("ownerName"),
                    "name": account_info.get("name"), 
                    "institution_name": institution_name,
                    "account_type": cash_account_type,
                    "last_four": last_four,
                    "scan": account_info.get("scan"),
                    "currency": account_info.get("currency", "GBP"),
                    "sync_enabled": False, # Default to OFF
                    "last_synced": None,
                    "last_api_call": None,
                    "sync_status": "pending"
                })
                
            except Exception as e:
                logger.error(f"Error fetching details for account {account_id}: {e}")
                continue
        
        # Update metadata
        metadata = load_gc_metadata()
        if requisition_id not in metadata:
            metadata[requisition_id] = {
                "reference": reference,
                "owner": owner,
                "created_at": datetime.now().isoformat(),
            }
        
        metadata[requisition_id].update({
            "reference": reference,
            "owner": owner,
            "requisition_id": requisition_id,
            "institution_id": institution_id,
            "accounts": accounts_data,
            "notes": "Connection successful, accounts linked."
        })
        save_gc_metadata(metadata)
            
        logger.info(f"Stored details for {len(accounts_data)} accounts for {requisition_id}")
        
    except Exception as e:
        logger.error(f"Error in fetch_and_store_account_details: {e}")


#
# API for the main "Bank Connections" page
#
@router.get("/requisitions")
async def gc_get_requisitions():
    """API endpoint to fetch all requisitions/connections."""
    logger.info("API call: GET /api/gc/requisitions")
    client = get_nordigen_client()
    requisitions = client.requisition.get_requisitions()
    results = requisitions.get("results", [])
    
    metadata = load_gc_metadata()
    active_requisition_ids = {req.get("id") for req in results}
    metadata_req_ids = set(metadata.keys())
    deleted_req_ids = metadata_req_ids - active_requisition_ids
    
    if deleted_req_ids:
        logger.info(f"Cleaning up {len(deleted_req_ids)} deleted requisitions")
        for req_id in deleted_req_ids:
            if req_id in metadata:
                logger.info(f"  Removing: {metadata[req_id].get('reference', req_id)}")
                del metadata[req_id]
        save_gc_metadata(metadata)
    
    enriched_results = []
    for req in results:
        req_id = req.get("id")
        req_metadata = metadata.get(req_id, {})
        
        days_remaining = 90
        created_str = req.get("created")
        if created_str:
            try:
                created_date = datetime.fromisoformat(created_str.replace('Z', '+00:00'))
                expiry_date = created_date + timedelta(days=90)
                today = datetime.now(created_date.tzinfo)
                days_remaining = (expiry_date - today).days
            except Exception as e:
                logger.warning(f"Could not calculate expiry for {req_id}: {e}")
                        
        enriched_results.append({
            **req,
            "owner": req_metadata.get("owner", "Unknown"),
            "notes": req_metadata.get("notes"),
            "accounts": req_metadata.get("accounts", []),
            "expiresInDays": days_remaining
        })
    
    logger.info(f"Returning {len(enriched_results)} requisitions.")
    return enriched_results

#
# API for the "Add Connection" modal bank list
#
@router.get("/institutions")
async def gc_get_institutions():
    """API endpoint to fetch all GB institutions."""
    logger.info("API call: GET /api/gc/institutions")
    client = get_nordigen_client()
    institutions = client.institution.get_institutions(country="GB")
    filtered_list = [
        {"id": i["id"], "name": i["name"], "logo": i["logo"]}
        for i in institutions
    ]
    return filtered_list

#
# API for CREATING a new connection (Called by React modal)
#
@router.post("/create-requisition")
async def gc_create_requisition_api(request: Request):
    """Create EUA and requisition."""
    body = await request.json()
    institution_id = body.get("institution_id")
    owner = body.get("owner", "Unknown")
    # --- FIX 1: Get base_url from frontend ---
    base_url = body.get("base_url") 
    
    if not institution_id:
        logger.error("API call: POST /api/gc/create-requisition FAILED: Missing institution_id")
        raise HTTPException(status_code=400, detail="institution_id is required")
    # --- Add check for base_url ---
    if not base_url:
        logger.error("API call: POST /api/gc/create-requisition FAILED: Missing base_url")
        raise HTTPException(status_code=400, detail="base_url is required")

    logger.info(f"API call: POST /api/gc/create-requisition for {institution_id}")
    
    try:
        client = get_nordigen_client()
        token = client.token 
        
        # Step 1: Create EUA
        eua_payload = {
            "institution_id": institution_id,
            "max_historical_days": 90,
            "access_valid_for_days": 90, 
            "access_scope": ["balances", "details", "transactions"],
        }
        
        async with httpx.AsyncClient() as http_client:
            eua_response = await http_client.post(
                "https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=eua_payload
            )
            eua_response.raise_for_status()
            eua_data = eua_response.json()
            eua_id = eua_data["id"]
        
            institution_name = "Unknown Bank"
            try:
                institutions = client.institution.get_institutions(country="GB")
                institution_name = next((i['name'] for i in institutions if i['id'] == institution_id), institution_id)
            except Exception:
                pass 

            reference = f"{owner} - {institution_name}"
        
            # --- FIX 2: Build the dynamic redirect URL ---
            # This now combines the base_url (e.g. http://192.168.1.70:6059)
            # with your API path (/gc/callback)
            dynamic_redirect_url = f"{base_url.rstrip('/')}/gc/callback"
            logger.info(f"Using dynamic redirect URL: {dynamic_redirect_url}")
            
            # Step 2: Create requisition
            requisition_payload = {
                "redirect": dynamic_redirect_url, # <-- Use the dynamic URL
                "institution_id": institution_id,
                "reference": reference,
                "agreement": eua_id,
                "user_language": "EN"
            }
        
            requisition_response = await http_client.post(
                "https://bankaccountdata.gocardless.com/api/v2/requisitions/",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=requisition_payload
            )
            requisition_response.raise_for_status()
            requisition_data = requisition_response.json()
        
        # Save stub metadata
        req_id = requisition_data["id"]
        metadata = load_gc_metadata()
        metadata[req_id] = {
            "reference": reference,
            "owner": owner,
            "notes": "Pending bank authorization...",
            "created_at": datetime.now().isoformat(),
            "notification": None,
            "accounts": []
        }
        save_gc_metadata(metadata)
        
        return {"link": requisition_data["link"], "requisition_id": req_id}
        
    except Exception as e:
        logger.error(f"Failed in create-requisition: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#
# This is the GoCardless CALLBACK, hit AFTER bank auth
#
@router.get("/callback")
async def gc_callback(request: Request, ref: str):
    logger.info(f"Callback received for ref: {ref}. Fetching account details.")
    
    requisition_id = ref
    
    try:
        metadata = load_gc_metadata()
        if requisition_id not in metadata:
            logger.error(f"Callback for unknown requisition {requisition_id}!")
            owner = "Unknown"
            reference = "Unknown (from callback)"
        else:
            owner = metadata[requisition_id].get("owner", "Unknown")
            reference = metadata[requisition_id].get("reference", "Unknown")

        # Call helper function to get account details
        await fetch_and_store_account_details(requisition_id, reference, owner)
        
    except Exception as e:
        logger.error(f"Error in callback: {e}")
        # --- FIX 3: Redirect to the correct page ---
        return RedirectResponse(url="/bank-connections?status=callback_failed")
    
    # --- FIX 3: Redirect to the correct page ---
    return RedirectResponse(url="/bank-connections?status=success")


#
# API for reconfirming an existing connection
#
@router.get("/reconfirm/{agreement_id}")
async def gc_reconfirm(agreement_id: str):
    logger.info(f"API call: GET /api/gc/reconfirm/{agreement_id}")
    try:
        client = get_nordigen_client()
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.put(
                f"https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/{agreement_id}/reconfirm/",
                headers={
                    "Authorization": f"Bearer {client.token}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            data = response.json()
        
        logger.info(f"Returning reconfirm link: {data.get('link')}")
        return {"reconfirm_link": data.get("link")}
    except Exception as e:
        logger.error(f"Failed in reconfirm: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#
# API for toggling sync
#
@router.post("/toggle-sync/{requisition_id}/{account_id}")
async def toggle_sync(requisition_id: str, account_id: str):
    logger.info(f"API call: POST /api/gc/toggle-sync/{requisition_id}/{account_id}")
    try:
        metadata = load_gc_metadata()
        if requisition_id not in metadata:
            raise HTTPException(status_code=404, detail="Requisition not found")
        
        account_found = False
        new_status = False
        for account in metadata[requisition_id].get("accounts", []):
            if account.get("account_id") == account_id:
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