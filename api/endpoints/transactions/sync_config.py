"""
Transaction Sync Configuration Endpoint

Returns configuration for the sync system:
- Cron schedule (when jobs run)
- Enabled accounts
- Sync preferences

Data is loaded from api/data/transactions/config.json
"""

from fastapi import APIRouter
import json
import os

router = APIRouter()

@router.get("/config")
async def get_sync_config():
    """
    Returns cron schedule and enabled account configuration.
    
    Response includes:
    - cron_schedule: Cron expression string (e.g., "0 */6 * * *")
    - cron_description: Human-readable schedule description
    - enabled_accounts: Array of account IDs that are synced
    - next_run_times: Array of next 4 scheduled run times
    
    Returns:
        dict: Configuration object
    """
    # Path to config file
    config_path = "api/data/transactions/config.json"
    
    # Try to load real config data
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return json.load(f)
    
    # Fallback to dummy config for development
    return {
        "cron_schedule": "0 */6 * * *",  # Every 6 hours
        "cron_description": "4 times daily at 00:00, 06:00, 12:00, 18:00 UTC",
        "enabled_accounts": [
            "3fa85f64-5717-4562-b3fc-2c963f66afa6",  # Starling
            "7cb85f64-5717-4562-b3fc-2c963f66afa9",  # Monzo
            "9db85f64-5717-4562-b3fc-2c963f66afb1",  # Revolut
            "2ab85f64-5717-4562-b3fc-2c963f66afc3"   # HSBC
        ],
        "next_run_times": [
            "2025-01-16T06:00:00Z",
            "2025-01-16T12:00:00Z",
            "2025-01-16T18:00:00Z",
            "2025-01-17T00:00:00Z"
        ],
        "timezone": "Europe/London"
    }
