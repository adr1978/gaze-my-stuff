from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from ..scripts.investments_handler import update_purchase, load_accounts

router = APIRouter()

class PurchaseRequest(BaseModel):
    accountName: str
    date: str
    shares: float
    originalDate: Optional[str] = None

@router.get("/accounts")
async def get_accounts():
    """Get all investment accounts"""
    try:
        return load_accounts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/purchase")
async def save_purchase(request: PurchaseRequest):
    """Add or edit a purchase"""
    try:
        updated_account = update_purchase(
            account_name=request.accountName,
            purchase_date=request.date,
            shares=request.shares,
            original_date=request.originalDate
        )
        return {"status": "success", "account": updated_account}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save purchase: {str(e)}")