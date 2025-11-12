"""
GoCardless Transaction Fetching Script

This script fetches transactions from GoCardless for all enabled accounts
and writes raw transaction data to daily log files.

Workflow:
1. Load enabled accounts from gc_metadata.json
2. For each account, call GoCardless API to fetch transactions
3. Write results to daily log file with fetch status
4. Update summary.json with run statistics

Run this script via cron: 0 */6 * * * (4 times daily)
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
from pathlib import Path

# Configuration
GOCARDLESS_API_BASE = "https://bankaccountdata.gocardless.com/api/v2"
GOCARDLESS_TOKEN = os.getenv("GOCARDLESS_SECRET_TOKEN", "")  # Load from environment
GC_METADATA_PATH = "src/data/gc_metadata.json"  # Path to account metadata
DATA_DIR = Path("api/data/transactions")
LOGS_DIR = DATA_DIR / "logs"

def load_account_metadata() -> Dict[str, Any]:
    """
    Load account metadata from gc_metadata.json.
    
    Returns account configuration including:
    - Account IDs
    - Institution names
    - Sync enabled status
    
    Returns:
        dict: Parsed metadata from gc_metadata.json
    """
    with open(GC_METADATA_PATH, 'r') as f:
        return json.load(f)

def get_enabled_accounts(metadata: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Extract list of accounts with sync_enabled=True.
    
    Args:
        metadata: Parsed gc_metadata.json content
    
    Returns:
        list: Array of enabled account objects with id, name, institution
    """
    enabled = []
    
    for req_id, req_data in metadata.items():
        for account in req_data.get("accounts", []):
            if account.get("sync_enabled", False):
                enabled.append({
                    "account_id": account["account_id"],
                    "account_name": f"{account['institution_name']} - {account['last_four']}",
                    "institution": account["institution_name"],
                    "currency": account["currency"]
                })
    
    return enabled

def fetch_transactions_for_account(account_id: str, date_from: str, date_to: str) -> Dict[str, Any]:
    """
    Fetch transactions from GoCardless API for a specific account.
    
    Makes GET request to:
    /api/v2/accounts/{account_id}/transactions/?date_from={date_from}&date_to={date_to}
    
    Args:
        account_id: GoCardless account UUID
        date_from: Start date (YYYY-MM-DD)
        date_to: End date (YYYY-MM-DD)
    
    Returns:
        dict: Response object containing:
            - status: "success" or "error"
            - http_status: HTTP status code
            - data: Transaction data (if successful)
            - error_body: Error details (if failed)
            - duration_ms: Request duration
    """
    start_time = datetime.now()
    
    url = f"{GOCARDLESS_API_BASE}/accounts/{account_id}/transactions/"
    headers = {
        "Authorization": f"Bearer {GOCARDLESS_TOKEN}",
        "Accept": "application/json"
    }
    params = {
        "date_from": date_from,
        "date_to": date_to
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "success",
                "http_status": 200,
                "data": data,
                "error_body": None,
                "duration_ms": duration_ms,
                "transactions_pending": len(data.get("transactions", {}).get("pending", [])),
                "transactions_booked": len(data.get("transactions", {}).get("booked", []))
            }
        else:
            return {
                "status": "error",
                "http_status": response.status_code,
                "data": None,
                "error_body": response.json() if response.text else {"error": "Unknown error"},
                "duration_ms": duration_ms,
                "transactions_pending": 0,
                "transactions_booked": 0
            }
    
    except requests.exceptions.RequestException as e:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        return {
            "status": "error",
            "http_status": 0,
            "data": None,
            "error_body": {"error": str(e)},
            "duration_ms": duration_ms,
            "transactions_pending": 0,
            "transactions_booked": 0
        }

def write_log_entry(date: str, run_data: Dict[str, Any]) -> None:
    """
    Write sync run results to daily log file.
    
    Creates/updates file: api/data/transactions/logs/YYYY-MM-DD.json
    Appends new run to the "runs" array.
    
    Args:
        date: Date string (YYYY-MM-DD)
        run_data: Complete run object with all account results
    """
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOGS_DIR / f"{date}.json"
    
    # Load existing log or create new
    if log_file.exists():
        with open(log_file, 'r') as f:
            log_data = json.load(f)
    else:
        log_data = {"date": date, "runs": []}
    
    # Append new run
    log_data["runs"].insert(0, run_data)  # Most recent first
    
    # Write back to file
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)
    
    print(f"✓ Log entry written to {log_file}")

def update_summary(run_data: Dict[str, Any]) -> None:
    """
    Update summary.json with latest run statistics.
    
    Updates:
    - today.total_transactions
    - today.successful_runs / failed_runs
    - today.last_run timestamp
    - Calculates next_run based on cron schedule
    
    Args:
        run_data: Complete run object
    """
    summary_file = DATA_DIR / "summary.json"
    
    # Load existing summary or create default
    if summary_file.exists():
        with open(summary_file, 'r') as f:
            summary = json.load(f)
    else:
        summary = {
            "today": {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "total_transactions": 0,
                "successful_runs": 0,
                "failed_runs": 0
            },
            "active_accounts": 0,
            "last_7_days_success_rate": 1.0
        }
    
    # Update statistics
    total_transactions = sum(
        acc.get("transactions_pending", 0) + acc.get("transactions_booked", 0)
        for acc in run_data["accounts_processed"]
    )
    
    summary["today"]["total_transactions"] += total_transactions
    summary["today"]["last_run"] = run_data["timestamp"]
    summary["today"]["duration_ms"] = run_data["duration_ms"]
    
    if run_data["status"] == "success":
        summary["today"]["successful_runs"] += 1
    else:
        summary["today"]["failed_runs"] += 1
    
    # Calculate next run (6 hours from now)
    next_run = datetime.fromisoformat(run_data["timestamp"]) + timedelta(hours=6)
    summary["today"]["next_run"] = next_run.isoformat()
    
    summary["last_updated"] = datetime.now().isoformat()
    
    # Write back
    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"✓ Summary updated: {total_transactions} transactions processed")

def main():
    """
    Main execution function - runs the complete fetch workflow.
    
    Steps:
    1. Load account metadata
    2. Fetch transactions for each enabled account
    3. Aggregate results
    4. Write to log file
    5. Update summary statistics
    """
    print("=== GoCardless Transaction Fetch Started ===")
    start_time = datetime.now()
    run_id = f"run_{int(start_time.timestamp())}"
    
    # Load enabled accounts from gc_metadata.json
    metadata = load_account_metadata()
    enabled_accounts = get_enabled_accounts(metadata)
    print(f"Found {len(enabled_accounts)} enabled accounts")
    
    # Fetch date range (last 7 days to catch any delayed transactions)
    date_to = datetime.now().strftime("%Y-%m-%d")
    date_from = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Process each account
    accounts_processed = []
    overall_status = "success"
    
    for account in enabled_accounts:
        print(f"\nFetching: {account['account_name']} ({account['account_id']})")
        
        fetch_result = fetch_transactions_for_account(
            account["account_id"],
            date_from,
            date_to
        )
        
        # Build account result object (matches expected log format)
        account_result = {
            "account_id": account["account_id"],
            "account_name": account["account_name"],
            "institution": account["institution"],
            "fetch_status": fetch_result["status"],
            "fetch_duration_ms": fetch_result["duration_ms"],
            "transactions_pending": fetch_result["transactions_pending"],
            "transactions_booked": fetch_result["transactions_booked"],
            "http_status": fetch_result["http_status"],
            "error_body": fetch_result["error_body"],
            "notion_upload": None  # Will be populated by enrich_and_upload.py
        }
        
        accounts_processed.append(account_result)
        
        # Update overall status
        if fetch_result["status"] == "error":
            overall_status = "error"
        
        print(f"  Status: {fetch_result['status']} ({fetch_result['http_status']})")
        print(f"  Pending: {fetch_result['transactions_pending']}, Booked: {fetch_result['transactions_booked']}")
    
    # Calculate total duration
    total_duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
    
    # Build complete run object
    run_data = {
        "run_id": run_id,
        "timestamp": start_time.isoformat(),
        "status": overall_status,
        "duration_ms": total_duration_ms,
        "accounts_processed": accounts_processed
    }
    
    # Write to log file
    today = datetime.now().strftime("%Y-%m-%d")
    write_log_entry(today, run_data)
    
    # Update summary statistics
    update_summary(run_data)
    
    print(f"\n=== Fetch Complete ===")
    print(f"Run ID: {run_id}")
    print(f"Status: {overall_status}")
    print(f"Duration: {total_duration_ms}ms")

if __name__ == "__main__":
    main()
