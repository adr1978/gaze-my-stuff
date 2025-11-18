import httpx 
import logging
import re
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
import urllib.parse 

# Correct relative import for the client utilities and metadata handling
from ..scripts.gc_client import get_nordigen_client, load_gc_metadata, save_gc_metadata 


# --- Configure logging ---
logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/gc", 
    tags=["gocardless-requisitions"],
)

# UUID regex pattern for basic validation
UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)


# Helper function to fetch account details - (FULL IMPLEMENTATION)
async def fetch_and_store_account_details(requisition_id: str, reference: str, owner: str):
    """
    Fetches detailed account information (IBAN, type, currency) from Nordigen 
    for all accounts linked in the requisition and stores it in the local metadata.
    NOTE: requisition_id MUST be the UUID.
    """
    logger.info(f"Fetching account details for UUID: {requisition_id}")
    try:
        client = get_nordigen_client()
        if client is None:
            raise Exception("Nordigen client could not be initialized. Check API keys.")
            
        # 1. Fetch the requisition from Nordigen using the actual UUID
        requisition = client.requisition.get_requisition_by_id(requisition_id)
        
        account_ids = requisition.get("accounts", [])
        institution_id = requisition.get("institution_id", "Unknown")
        institution_name = "Unknown Bank"
        
        # Look up institution name
        try:
            institutions = client.institution.get_institutions(country="GB")
            institution_name = next((i['name'] for i in institutions if i['id'] == institution_id), institution_id)
        except Exception:
            pass 

        accounts_data = []
        for account_id in account_ids:
            try:
                # 2. Fetch details for each linked account
                account_details = client.account_api(account_id).get_details()
                account_info = account_details.get("account", {})
                
                cash_account_type = account_info.get("cashAccountType", "UNKNOWN")
                last_four = "XXXX"
                
                # Determine last four digits based on account type
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
                    "sync_enabled": False, # Default sync to OFF
                    "last_synced": None,
                    "last_api_call": None,
                    "sync_status": "pending"
                })
                
            except Exception as e:
                logger.error(f"Error fetching details for account {account_id}: {e}")
                continue
        
        # 3. Update the local metadata entry using the UUID
        metadata = load_gc_metadata()
        
        # Update the existing entry (which was created with a stub during requisition creation)
        if requisition_id not in metadata:
            # Should not happen in a successful flow, but good for safety
            metadata[requisition_id] = {} 

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
        raise e 


# --- Endpoint for getting all requisitions (GET /api/gc/requisitions) ---
@router.get("/requisitions")
async def gc_get_requisitions():
    """API endpoint to fetch all requisitions/connections."""
    logger.info("API call: GET /api/gc/requisitions")
    client = get_nordigen_client()
    if client is None: raise HTTPException(status_code=503, detail="GoCardless service unavailable.")
    
    requisitions = client.requisition.get_requisitions()
    results = requisitions.get("results", [])
    
    metadata = load_gc_metadata()
    active_requisition_ids = {req.get("id") for req in results}
    metadata_req_ids = set(metadata.keys())
    deleted_req_ids = metadata_req_ids - active_requisition_ids
    
    # Cleanup entries in local metadata if they no longer exist in the bank's API
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
                        
        # Merge API data with local sync metadata
        enriched_results.append({
            **req,
            "owner": req_metadata.get("owner", "Unknown"),
            "notes": req_metadata.get("notes"),
            "accounts": req_metadata.get("accounts", []),
            "expiresInDays": days_remaining
        })
    
    logger.info(f"Returning {len(enriched_results)} requisitions.")
    return enriched_results

# --- Endpoint for getting institutions (GET /api/gc/institutions) ---
@router.get("/institutions")
async def gc_get_institutions():
    """API endpoint to fetch all GB institutions."""
    logger.info("API call: GET /api/gc/institutions")
    client = get_nordigen_client()
    if client is None: raise HTTPException(status_code=503, detail="GoCardless service unavailable.")
    
    institutions = client.institution.get_institutions(country="GB")
    filtered_list = [
        {"id": i["id"], "name": i["name"], "logo": i["logo"]}
        for i in institutions
    ]
    return filtered_list


# --- Endpoint to create EUA and Requisition (POST /api/gc/create-requisition) ---
@router.post("/create-requisition")
async def gc_create_requisition_api(request: Request):
    """
    Creates the End-User Agreement (EUA) and Requisition, and returns the bank authorization link.
    Stores a stub in local metadata, keyed by the requisition UUID.
    """
    body = await request.json()
    institution_id = body.get("institution_id")
    owner = body.get("owner", "Unknown")
    
    # Get the stable API URL (for bank redirect) and the flexible frontend URL (for final user redirect)
    api_base_url = body.get("api_base_url") 
    frontend_base_url = body.get("frontend_base_url") 
    
    if not institution_id:
        raise HTTPException(status_code=400, detail="institution_id is required")
    if not api_base_url or not frontend_base_url:
        logger.error("API call: POST /api/gc/create-requisition FAILED: Missing base_url parameter(s)")
        raise HTTPException(status_code=400, detail="api_base_url and frontend_base_url are required")

    logger.info(f"API call: POST /api/gc/create-requisition for {institution_id}")
    
    try:
        client = get_nordigen_client()
        if client is None: raise HTTPException(status_code=503, detail="GoCardless service unavailable.")
        token = client.token 
        
        # Step 1: Create End-User Agreement (EUA)
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

            # Create the human-readable reference string
            reference = f"{owner} - {institution_name}"
        
            # Step 2: Construct the dynamic bank redirect URL
            # The bank redirects to the STABLE API URL (api_base_url + /api/gc/callback)
            # The frontend URL is encoded and attached as a query parameter for the backend to use later
            encoded_frontend_url = urllib.parse.quote_plus(frontend_base_url)
            
            dynamic_redirect_url = (
                f"{api_base_url.rstrip('/')}/api/gc/callback?"
                f"redirect_to={encoded_frontend_url}"
            )
            
            logger.info(f"Using dynamic redirect URL for bank: {dynamic_redirect_url}")
            
            # Step 3: Create requisition
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
        
        # Step 4: Save the stub metadata (key is the actual UUID)
        req_id = requisition_data["id"]
        metadata = load_gc_metadata()
        metadata[req_id] = {
            "reference": reference, # Store the human-readable string for lookup
            "owner": owner,
            "notes": "",
            "created_at": datetime.now().isoformat(),
            "notification": None,
            "accounts": []
        }
        save_gc_metadata(metadata)
        
        # Return the bank's authorization link to the frontend
        return {"link": requisition_data["link"], "requisition_id": req_id}
        
    except Exception as e:
        logger.error(f"Failed in create-requisition: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Endpoint for GoCardless Callback (GET /api/gc/callback) ---
@router.get("/callback")
async def gc_callback(
    request: Request, 
    ref: str, 
    error: str = None, 
    details: str = None,
    redirect_to: str = None 
):
    """
    Handles the redirect from the bank's authorization page on the FastAPI server. 
    It performs a local lookup to convert the Reference String (ref) to the UUID.
    """
    
    # -----------------------------------------------------------
    # Setup for final user redirect
    # -----------------------------------------------------------
    final_base_url = urllib.parse.unquote_plus(redirect_to) if redirect_to else ""
    frontend_redirect_url = f"{final_base_url.rstrip('/')}/bank-connections" if final_base_url else "/bank-connections"
    
    if error:
        # --- FAILURE/CANCELLATION PATH ---
        logger.warning(f"Callback indicates FAILURE: {error} - {details}. Redirecting to frontend.")
        
        # Redirect back to the flexible frontend URL with error status parameters.
        redirect_url = (
            f"{frontend_redirect_url}?"
            f"status=failure&"
            f"error={error}&"
            f"details={details}"
        )
        return RedirectResponse(url=redirect_url, status_code=303)
    
    # --- SUCCESS PATH ---
    logger.info(f"Callback received SUCCESS. Resolving Requisition ID from reference.")
    
    # The 'ref' parameter contains the Reference String (e.g., "Business - Starling").
    reference_string = ref
    requisition_id = None
    
    try:
        metadata = load_gc_metadata()
        
        # CORE FIX: Search the local metadata for the UUID that corresponds to the reference string.
        # This is the essential workaround for the bank not returning the UUID directly.
        for uuid, data in metadata.items():
            if data.get("reference") == reference_string:
                requisition_id = uuid
                break
        
        if not requisition_id:
            logger.error(f"FATAL: Could not find requisition UUID for reference: '{reference_string}' in local metadata.")
            raise ValueError("Requisition UUID not found in local metadata after callback.")

        logger.info(f"SUCCESS: Resolved reference '{reference_string}' to UUID: {requisition_id}. Fetching accounts...")

        # Retrieve the necessary details (owner/reference) using the actual UUID
        owner = metadata.get(requisition_id, {}).get("owner", "Unknown")
        reference = metadata.get(requisition_id, {}).get("reference", requisition_id)

        # Call the server-to-server function with the CORRECT UUID
        await fetch_and_store_account_details(requisition_id, reference, owner)
        
    except Exception as e:
        logger.error(f"Error during server-side processing for UUID {requisition_id}: {e}")
        # Redirect to frontend with a processing failure message
        return RedirectResponse(
            url=f"{frontend_redirect_url}?status=failure&error=BackendProcessingError",
            status_code=303
        )
    
    # Final Success redirect to the frontend
    return RedirectResponse(
        url=f"{frontend_redirect_url}?status=success",
        status_code=303
    )


# --- Endpoint for reconfirming an agreement (GET /api/gc/reconfirm/{agreement_id}) ---
@router.get("/reconfirm/{agreement_id}")
async def gc_reconfirm(agreement_id: str):
    """API for reconfirming an existing connection."""
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