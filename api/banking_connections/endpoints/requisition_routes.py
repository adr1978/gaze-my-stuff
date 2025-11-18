# api/banking_connections/endpoints/requisition_routes.py

import httpx
import logging
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
# Correct relative import for the client file
from ..scripts.gc_client import get_nordigen_client, load_gc_metadata, save_gc_metadata 
from datetime import datetime, timedelta

# --- Configure logging ---
logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/gc",  # All routes in this file will start with /api/gc
    tags=["gocardless-requisitions"],
)


# Helper function to fetch account details (kept here as it's tightly coupled with the callback)
async def fetch_and_store_account_details(requisition_id: str, reference: str, owner: str):
    """
    Fetch account details for all accounts in a requisition and store in metadata.
    Called after successful bank authorization.
    """
    logger.info(f"Fetching account details for req_id: {requisition_id}")
    try:
        client = get_nordigen_client()
        if client is None:
            raise Exception("Nordigen client could not be initialized. Check API keys.")
            
        requisition = client.requisition.get_requisition_by_id(requisition_id)
        account_ids = requisition.get("accounts", [])
        
        # ... (Rest of the logic from original routes.py to fetch and store details)
        
        institution_id = requisition.get("institution_id", "Unknown")
        
        # Get institution name
        institution_name = "Unknown Bank"
        try:
            institutions = client.institution.get_institutions(country="GB")
            institution_name = next((i['name'] for i in institutions if i['id'] == institution_id), institution_id)
        except Exception:
            pass 

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
        
# --- Endpoints for Requisition Flow ---
        
@router.get("/requisitions")
async def gc_get_requisitions():
    """API endpoint to fetch all requisitions/connections."""
    # (Content from the original routes.py function: gc_get_requisitions)
    logger.info("API call: GET /api/gc/requisitions")
    client = get_nordigen_client()
    if client is None: raise HTTPException(status_code=503, detail="GoCardless service unavailable.")
    
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


@router.get("/institutions")
async def gc_get_institutions():
    """API endpoint to fetch all GB institutions."""
    # (Content from the original routes.py function: gc_get_institutions)
    logger.info("API call: GET /api/gc/institutions")
    client = get_nordigen_client()
    if client is None: raise HTTPException(status_code=503, detail="GoCardless service unavailable.")
    
    institutions = client.institution.get_institutions(country="GB")
    filtered_list = [
        {"id": i["id"], "name": i["name"], "logo": i["logo"]}
        for i in institutions
    ]
    return filtered_list


@router.post("/create-requisition")
async def gc_create_requisition_api(request: Request):
    """Create EUA and requisition."""
    # (Content from the original routes.py function: gc_create_requisition_api)
    body = await request.json()
    institution_id = body.get("institution_id")
    owner = body.get("owner", "Unknown")
    base_url = body.get("base_url") 
    
    if not institution_id:
        logger.error("API call: POST /api/gc/create-requisition FAILED: Missing institution_id")
        raise HTTPException(status_code=400, detail="institution_id is required")
    if not base_url:
        logger.error("API call: POST /api/gc/create-requisition FAILED: Missing base_url")
        raise HTTPException(status_code=400, detail="base_url is required")

    logger.info(f"API call: POST /api/gc/create-requisition for {institution_id}")
    
    try:
        client = get_nordigen_client()
        if client is None: raise HTTPException(status_code=503, detail="GoCardless service unavailable.")
            
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
        
            dynamic_redirect_url = f"{base_url.rstrip('/')}/gc/callback"
            logger.info(f"Using dynamic redirect URL: {dynamic_redirect_url}")
            
            # Step 2: Create requisition
            requisition_payload = {
                "redirect": dynamic_redirect_url, 
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


@router.get("/callback")
async def gc_callback(request: Request, ref: str):
    """This is the GoCardless CALLBACK, hit AFTER bank auth."""
    # (Content from the original routes.py function: gc_callback)
    logger.info(f"Callback received for ref: {ref}. Fetching account details.")
    
    requisition_id = ref
    
    try:
        metadata = load_gc_metadata()
        owner = metadata[requisition_id].get("owner", "Unknown") if requisition_id in metadata else "Unknown"
        reference = metadata[requisition_id].get("reference", "Unknown") if requisition_id in metadata else "Unknown (from callback)"

        await fetch_and_store_account_details(requisition_id, reference, owner)
        
    except Exception as e:
        logger.error(f"Error in callback: {e}")
        return RedirectResponse(url="/bank-connections?status=callback_failed")
    
    return RedirectResponse(url="/bank-connections?status=success")


@router.get("/reconfirm/{agreement_id}")
async def gc_reconfirm(agreement_id: str):
    """API for reconfirming an existing connection."""
    # (Content from the original routes.py function: gc_reconfirm)
    logger.info(f"API call: GET /api/gc/reconfirm/{agreement_id}")
    try:
        client = get_nordigen_client()
        if client is None: raise HTTPException(status_code=503, detail="GoCardless service unavailable.")
            
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