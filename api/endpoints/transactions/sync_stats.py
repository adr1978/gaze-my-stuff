"""
Transaction Sync Statistics Endpoint

Returns summary statistics for the transaction sync dashboard:
- Today's transaction count
- Success/failure rates
- Next scheduled run time
- Active account count

Data is loaded from api/data/transactions/summary.json with fallback to dummy data.
"""

from fastapi import APIRouter
from datetime import datetime, timedelta
import json
import os

router = APIRouter()

@router.get("/stats")
async def get_sync_stats():
    """
    Returns current day statistics and 7-day success rate.
    
    Response includes:
    - today.total_transactions: Total transactions fetched today
    - today.successful_runs: Count of successful sync runs
    - today.failed_runs: Count of failed sync runs
    - today.last_run: ISO timestamp of most recent run
    - today.next_run: ISO timestamp of next scheduled run
    - active_accounts: Number of connected bank accounts
    - last_7_days_success_rate: Percentage (0.0-1.0) of successful runs
    
    Returns:
        dict: Statistics object with current and historical data
    """
    # Path to summary data file (updated by sync scripts)
    data_path = "api/data/transactions/summary.json"
    
    # Try to load real data from file
    if os.path.exists(data_path):
        with open(data_path, "r") as f:
            return json.load(f)
    
    # Fallback to dummy data for development/testing
    return {
        "today": {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "total_transactions": 87,
            "successful_runs": 3,
            "failed_runs": 0,
            "last_run": (datetime.now() - timedelta(hours=2, minutes=15)).isoformat(),
            "next_run": (datetime.now() + timedelta(hours=1, minutes=45)).isoformat(),
            "duration_ms": 3240
        },
        "active_accounts": 4,
        "last_7_days_success_rate": 0.96
    }
