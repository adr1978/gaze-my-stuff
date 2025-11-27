import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

# Define path to the JSON data file relative to this script
# Script is in /api/investments_tracker/scripts/
# Data is in /api/investments_tracker/data/
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "investment_accounts.json"

def load_accounts() -> list:
    """Load all investment accounts from JSON file"""
    if not DATA_FILE.exists():
        return []
    
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def save_accounts(accounts: list) -> None:
    """Save investment accounts to JSON file"""
    # Ensure directory exists
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    with open(DATA_FILE, 'w') as f:
        json.dump(accounts, f, indent=2)

def update_purchase(account_name: str, purchase_date: str, shares: float, original_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Add or edit a purchase for a specific account.
    
    Args:
        account_name: Name of the account to update
        purchase_date: The date of the purchase (YYYY-MM-DD)
        shares: Number of shares
        original_date: If editing, the original date of the purchase to find and replace
        
    Returns:
        The updated account object
    """
    accounts = load_accounts()
    account_found = False
    updated_account = None

    for account in accounts:
        if account["accountName"] == account_name:
            account_found = True
            purchases = account.get("purchases", [])
            
            # Create new purchase object
            new_purchase = {"date": purchase_date, "shares": float(shares)}
            
            if original_date:
                # EDIT MODE: Find the specific purchase by original date
                found_index = -1
                for i, p in enumerate(purchases):
                    if p["date"] == original_date:
                        found_index = i
                        break
                
                if found_index >= 0:
                    purchases[found_index] = new_purchase
                else:
                    # If original purchase not found, just append
                    purchases.append(new_purchase)
            else:
                # ADD MODE: Just append
                purchases.append(new_purchase)
            
            # Update purchases list
            account["purchases"] = purchases
            
            # Recalculate total shares for the account
            total_shares = sum(p["shares"] for p in purchases)
            account["totalShares"] = round(total_shares, 4)
            
            updated_account = account
            break
    
    if not account_found:
        raise ValueError(f"Account '{account_name}' not found")

    save_accounts(accounts)
    return updated_account