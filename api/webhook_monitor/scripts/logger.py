"""
Webhook Logger Utility

Handles saving, loading, and cleaning up webhook logs.
Enforces configurable retention period.
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
RETENTION_DAYS = int(os.getenv("WEBHOOK_RETENTION_DAYS", "7"))
LOG_FILE_PATH = Path(__file__).parent.parent / "data" / "webhooks_log.json"


def ensure_log_file_exists():
    """Ensure the log file and directory exist."""
    LOG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not LOG_FILE_PATH.exists():
        LOG_FILE_PATH.write_text("[]")


def load_webhooks() -> List[Dict[str, Any]]:
    """Load all webhooks from the log file."""
    ensure_log_file_exists()
    try:
        with open(LOG_FILE_PATH, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_webhooks(webhooks: List[Dict[str, Any]]):
    """Save webhooks to the log file."""
    ensure_log_file_exists()
    with open(LOG_FILE_PATH, 'w') as f:
        json.dump(webhooks, f, indent=2, default=str)


def cleanup_old_webhooks(webhooks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove webhooks older than the retention period."""
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    return [
        webhook for webhook in webhooks
        if datetime.fromisoformat(webhook['timestamp'].replace('Z', '+00:00')) > cutoff_date
    ]


def log_webhook(
    method: str,
    endpoint: str,
    headers: Dict[str, str],
    body: Any,
    status_code: int = 200,
    status_text: str = "OK"
) -> Dict[str, Any]:
    """
    Log a received webhook to the JSON file.
    
    Args:
        method: HTTP method (GET, POST, PUT, DELETE)
        endpoint: The endpoint path
        headers: Request headers dictionary
        body: Request body (will be JSON stringified)
        status_code: HTTP status code for the response
        status_text: Status text description
    
    Returns:
        The logged webhook entry
    """
    ensure_log_file_exists()
    
    # Load existing webhooks
    webhooks = load_webhooks()
    
    # Clean up old webhooks
    webhooks = cleanup_old_webhooks(webhooks)
    
    # Create new webhook entry
    webhook_entry = {
        "id": f"wh_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}",
        "timestamp": datetime.utcnow().isoformat() + 'Z',
        "method": method.upper(),
        "endpoint": endpoint,
        "statusCode": status_code,
        "statusText": status_text,
        "headers": headers,
        "body": json.dumps(body, indent=2) if not isinstance(body, str) else body
    }
    
    # Add to list (newest first)
    webhooks.insert(0, webhook_entry)
    
    # Save back to file
    save_webhooks(webhooks)
    
    return webhook_entry


def get_webhooks_since(last_checked: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get webhooks, optionally filtered by timestamp.
    
    Args:
        last_checked: ISO format timestamp to filter webhooks newer than this
    
    Returns:
        List of webhook entries
    """
    webhooks = load_webhooks()
    
    # Clean up old webhooks while we're at it
    webhooks = cleanup_old_webhooks(webhooks)
    save_webhooks(webhooks)
    
    if last_checked:
        try:
            last_checked_dt = datetime.fromisoformat(last_checked.replace('Z', '+00:00'))
            webhooks = [
                webhook for webhook in webhooks
                if datetime.fromisoformat(webhook['timestamp'].replace('Z', '+00:00')) > last_checked_dt
            ]
        except (ValueError, AttributeError):
            # If timestamp parsing fails, return all webhooks
            pass
    
    return webhooks
