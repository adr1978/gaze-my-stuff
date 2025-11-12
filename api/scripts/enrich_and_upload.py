"""
Transaction Enrichment and Notion Upload Script

This script processes transactions fetched by fetch_transactions.py:
1. Enriches transactions with metadata (category, merchant cleanup)
2. Uploads to Notion database
3. Updates log entries with upload status

Should run immediately after fetch_transactions.py completes.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path
import requests

# Configuration
NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_TOKEN = os.getenv("NOTION_SECRET_TOKEN", "")  # Load from environment
NOTION_DATABASE_ID = os.getenv("NOTION_TRANSACTIONS_DB_ID", "")  # Your Notion database ID
DATA_DIR = Path("api/data/transactions")
LOGS_DIR = DATA_DIR / "logs"

def load_latest_run(date: str) -> Optional[Dict[str, Any]]:
    """
    Load the most recent run from today's log file.
    
    Args:
        date: Date string (YYYY-MM-DD)
    
    Returns:
        dict: Most recent run object, or None if file doesn't exist
    """
    log_file = LOGS_DIR / f"{date}.json"
    
    if not log_file.exists():
        return None
    
    with open(log_file, 'r') as f:
        log_data = json.load(f)
    
    if not log_data.get("runs"):
        return None
    
    return log_data["runs"][0]  # Most recent run

def categorize_transaction(transaction: Dict[str, Any]) -> str:
    """
    Enrich transaction with category based on merchant/description.
    
    Uses simple keyword matching. In production, could use:
    - ML model for categorization
    - External categorization API
    - User-defined rules
    
    Args:
        transaction: Raw transaction object from GoCardless
    
    Returns:
        str: Category name (e.g., "Groceries", "Transport", "Bills")
    """
    # Extract merchant/description
    merchant = transaction.get("creditorName", "").lower()
    description = transaction.get("remittanceInformationUnstructured", "").lower()
    combined = f"{merchant} {description}"
    
    # Simple keyword matching
    categories = {
        "Groceries": ["tesco", "sainsbury", "asda", "morrisons", "waitrose", "aldi", "lidl"],
        "Transport": ["uber", "tfl", "trainline", "national rail", "petrol", "shell", "bp"],
        "Restaurants": ["restaurant", "cafe", "coffee", "starbucks", "costa", "pret"],
        "Bills": ["water", "electric", "gas", "council tax", "broadband", "phone"],
        "Entertainment": ["cinema", "netflix", "spotify", "amazon prime", "theatre"],
        "Shopping": ["amazon", "ebay", "argos", "john lewis", "next", "zara", "h&m"],
        "Health": ["pharmacy", "boots", "superdrug", "gym", "fitness"]
    }
    
    for category, keywords in categories.items():
        if any(keyword in combined for keyword in keywords):
            return category
    
    return "Other"

def clean_merchant_name(merchant: str) -> str:
    """
    Clean up merchant name for better readability in Notion.
    
    Removes common prefixes, locations, transaction IDs.
    
    Args:
        merchant: Raw merchant name from transaction
    
    Returns:
        str: Cleaned merchant name
    """
    if not merchant:
        return "Unknown"
    
    # Remove common patterns
    cleaned = merchant.upper()
    
    # Remove location codes (e.g., "TESCO STORES 1234")
    patterns_to_remove = [
        r'\d{4,}',  # 4+ digit numbers
        r'STORE\s+\d+',
        r'BRANCH\s+\d+',
        r'\bLONDON\b',
        r'\bUK\b',
        r'\bGBR\b'
    ]
    
    import re
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    # Remove extra whitespace
    cleaned = ' '.join(cleaned.split())
    
    return cleaned.title()

def upload_transaction_to_notion(transaction: Dict[str, Any], account_name: str) -> Dict[str, Any]:
    """
    Upload a single enriched transaction to Notion database.
    
    Creates a new page in the Notion database with properties:
    - Date (booking date)
    - Amount (transaction amount)
    - Merchant (cleaned creditor name)
    - Category (enriched category)
    - Account (which bank account)
    - Description (remittance information)
    
    Args:
        transaction: Enriched transaction object
        account_name: Name of the account (e.g., "Starling - 8246")
    
    Returns:
        dict: Response object with status and error details
    """
    start_time = datetime.now()
    
    url = f"{NOTION_API_BASE}/pages"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    
    # Extract transaction details
    amount = float(transaction["transactionAmount"]["amount"])
    currency = transaction["transactionAmount"]["currency"]
    merchant = clean_merchant_name(transaction.get("creditorName", "Unknown"))
    category = categorize_transaction(transaction)
    booking_date = transaction.get("bookingDate", transaction.get("valueDate", ""))
    description = transaction.get("remittanceInformationUnstructured", "")
    
    # Build Notion page properties
    # NOTE: Property names must match your Notion database schema
    payload = {
        "parent": {"database_id": NOTION_DATABASE_ID},
        "properties": {
            "Date": {
                "date": {"start": booking_date}
            },
            "Amount": {
                "number": amount
            },
            "Merchant": {
                "title": [{"text": {"content": merchant}}]
            },
            "Category": {
                "select": {"name": category}
            },
            "Account": {
                "select": {"name": account_name}
            },
            "Currency": {
                "select": {"name": currency}
            },
            "Description": {
                "rich_text": [{"text": {"content": description[:2000]}}]  # Notion limit
            },
            "Transaction ID": {
                "rich_text": [{"text": {"content": transaction.get("transactionId", "")}}]
            }
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        if response.status_code in [200, 201]:
            return {
                "status": "success",
                "http_status": response.status_code,
                "duration_ms": duration_ms,
                "error_body": None
            }
        else:
            return {
                "status": "error",
                "http_status": response.status_code,
                "duration_ms": duration_ms,
                "error_body": response.json() if response.text else {"error": "Unknown error"}
            }
    
    except requests.exceptions.RequestException as e:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        return {
            "status": "error",
            "http_status": 0,
            "duration_ms": duration_ms,
            "error_body": {"error": str(e)}
        }

def process_account_transactions(account_data: Dict[str, Any], raw_transactions: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process all transactions for an account and upload to Notion.
    
    Args:
        account_data: Account object from log file
        raw_transactions: Raw transaction data from GoCardless fetch
    
    Returns:
        dict: Notion upload result object with status and counts
    """
    if not raw_transactions:
        return {
            "status": "skipped",
            "duration_ms": 0,
            "uploaded_count": 0,
            "http_status": 0,
            "error_body": {"message": "No transactions to upload"}
        }
    
    start_time = datetime.now()
    uploaded_count = 0
    errors = []
    
    # Combine booked and pending transactions
    all_transactions = (
        raw_transactions.get("transactions", {}).get("booked", []) +
        raw_transactions.get("transactions", {}).get("pending", [])
    )
    
    print(f"  Processing {len(all_transactions)} transactions...")
    
    for transaction in all_transactions:
        result = upload_transaction_to_notion(transaction, account_data["account_name"])
        
        if result["status"] == "success":
            uploaded_count += 1
        else:
            errors.append(result["error_body"])
    
    total_duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
    
    # Determine overall status
    if uploaded_count == len(all_transactions):
        status = "success"
    elif uploaded_count > 0:
        status = "warning"  # Partial success
    else:
        status = "error"
    
    return {
        "status": status,
        "duration_ms": total_duration_ms,
        "uploaded_count": uploaded_count,
        "http_status": 200 if status == "success" else 500,
        "error_body": errors[0] if errors else None  # Show first error
    }

def update_log_with_notion_results(date: str, run_id: str, account_results: List[Dict[str, Any]]) -> None:
    """
    Update the log file with Notion upload results.
    
    Finds the matching run by run_id and updates the notion_upload field
    for each account.
    
    Args:
        date: Date string (YYYY-MM-DD)
        run_id: Run identifier
        account_results: Array of Notion upload results per account
    """
    log_file = LOGS_DIR / f"{date}.json"
    
    with open(log_file, 'r') as f:
        log_data = json.load(f)
    
    # Find the matching run
    for run in log_data["runs"]:
        if run["run_id"] == run_id:
            # Update each account's notion_upload field
            for i, account in enumerate(run["accounts_processed"]):
                if i < len(account_results):
                    account["notion_upload"] = account_results[i]
            
            # Update overall run status if Notion had errors
            if any(r["status"] == "error" for r in account_results):
                run["status"] = "error"
            elif any(r["status"] == "warning" for r in account_results):
                run["status"] = "warning"
            
            break
    
    # Write back
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)
    
    print(f"✓ Log updated with Notion upload results")

def main():
    """
    Main execution function - enriches and uploads transactions.
    
    Steps:
    1. Load most recent run from today's log
    2. For each account with successful fetch:
        a. Load raw transaction data
        b. Enrich with categories
        c. Upload to Notion
        d. Record results
    3. Update log file with Notion upload status
    """
    print("=== Transaction Enrichment & Notion Upload Started ===")
    
    today = datetime.now().strftime("%Y-%m-%d")
    latest_run = load_latest_run(today)
    
    if not latest_run:
        print("No recent fetch run found. Run fetch_transactions.py first.")
        return
    
    run_id = latest_run["run_id"]
    print(f"Processing run: {run_id}")
    
    # Process each account that had a successful fetch
    account_notion_results = []
    
    for account in latest_run["accounts_processed"]:
        print(f"\nProcessing: {account['account_name']}")
        
        if account["fetch_status"] != "success":
            print(f"  Skipping (fetch failed)")
            account_notion_results.append({
                "status": "skipped",
                "duration_ms": 0,
                "uploaded_count": 0,
                "http_status": 0,
                "error_body": None
            })
            continue
        
        # In production, raw transaction data would be stored somewhere accessible
        # For now, we'll need to re-fetch or have it passed from the previous script
        # This is a placeholder - actual implementation would load from temp storage
        
        # Simulated transaction data (replace with actual data loading)
        raw_transactions = {
            "transactions": {
                "booked": [],
                "pending": []
            }
        }
        
        # Process and upload
        notion_result = process_account_transactions(account, raw_transactions)
        account_notion_results.append(notion_result)
        
        print(f"  Uploaded: {notion_result['uploaded_count']} transactions")
        print(f"  Status: {notion_result['status']}")
    
    # Update log file
    update_log_with_notion_results(today, run_id, account_notion_results)
    
    print("\n=== Enrichment & Upload Complete ===")

if __name__ == "__main__":
    main()
