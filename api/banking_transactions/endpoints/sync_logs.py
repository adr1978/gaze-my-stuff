"""
Transaction Sync Logs Endpoint

Returns detailed log entries for sync runs, including:
- Bank account fetch status
- Transaction counts (pending/booked)
- Notion upload status
- Error details

Data is loaded from daily log files in api/banking_transactions/data/logs/
"""

from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import json
import os

router = APIRouter()

@router.get("/logs")
async def get_sync_logs(
    date: str = Query(default=None, description="Date in YYYY-MM-DD format"),
    limit: int = Query(default=20, description="Maximum number of log entries to return")
):
    """
    Returns paginated log entries for a specific date.
    
    Args:
        date: Target date (defaults to today if not provided)
        limit: Maximum number of runs to return
    
    Response includes array of run objects, each containing:
    - run_id: Unique identifier for the sync run
    - timestamp: ISO timestamp when run started
    - status: Overall status (success/warning/error)
    - duration_ms: Total duration in milliseconds
    - accounts_processed: Array of account fetch/upload details
    
    Returns:
        list: Array of log entries (most recent first)
    """
    # Default to today's date if not provided
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    # Path to daily log file
    log_file = f"api/banking_transactions/data/logs/{date}.json"
    
    # Try to load real log data
    if os.path.exists(log_file):
        with open(log_file, "r") as f:
            data = json.load(f)
            # Return most recent runs first
            return data["runs"][:limit]
    
    # Fallback to dummy data for development/testing
    # Generate dummy runs with different scenarios
    now = datetime.now()
    
    return [
        {
            "run_id": f"run_{int(now.timestamp())}",
            "timestamp": now.isoformat(),
            "status": "success",
            "duration_ms": 3240,
            "accounts_processed": [
                {
                    "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    "account_name": "Starling - 8246",
                    "institution": "Starling",
                    "fetch_status": "success",
                    "fetch_duration_ms": 1200,
                    "transactions_pending": 5,
                    "transactions_booked": 12,
                    "http_status": 200,
                    "error_body": None,
                    "notion_upload": {
                        "status": "success",
                        "duration_ms": 980,
                        "uploaded_count": 17,
                        "http_status": 200,
                        "error_body": None
                    }
                },
                {
                    "account_id": "7cb85f64-5717-4562-b3fc-2c963f66afa9",
                    "account_name": "Monzo - 4521",
                    "institution": "Monzo",
                    "fetch_status": "success",
                    "fetch_duration_ms": 890,
                    "transactions_pending": 2,
                    "transactions_booked": 8,
                    "http_status": 200,
                    "error_body": None,
                    "notion_upload": {
                        "status": "success",
                        "duration_ms": 750,
                        "uploaded_count": 10,
                        "http_status": 200,
                        "error_body": None
                    }
                }
            ]
        },
        {
            "run_id": f"run_{int((now - timedelta(hours=6)).timestamp())}",
            "timestamp": (now - timedelta(hours=6)).isoformat(),
            "status": "warning",
            "duration_ms": 2850,
            "accounts_processed": [
                {
                    "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    "account_name": "Starling - 8246",
                    "institution": "Starling",
                    "fetch_status": "success",
                    "fetch_duration_ms": 1100,
                    "transactions_pending": 0,
                    "transactions_booked": 3,
                    "http_status": 200,
                    "error_body": None,
                    "notion_upload": {
                        "status": "error",
                        "duration_ms": 1200,
                        "uploaded_count": 0,
                        "http_status": 500,
                        "error_body": {
                            "error": "Internal Server Error",
                            "message": "Notion API rate limit exceeded"
                        }
                    }
                }
            ]
        },
        {
            "run_id": f"run_{int((now - timedelta(hours=12)).timestamp())}",
            "timestamp": (now - timedelta(hours=12)).isoformat(),
            "status": "error",
            "duration_ms": 1500,
            "accounts_processed": [
                {
                    "account_id": "7cb85f64-5717-4562-b3fc-2c963f66afa9",
                    "account_name": "Monzo - 4521",
                    "institution": "Monzo",
                    "fetch_status": "error",
                    "fetch_duration_ms": 1500,
                    "transactions_pending": 0,
                    "transactions_booked": 0,
                    "http_status": 401,
                    "error_body": {
                        "error": "Unauthorized",
                        "message": "Access token expired. Please reconfirm connection."
                    },
                    "notion_upload": None
                }
            ]
        }
    ]


@router.get("/logs/{run_id}")
async def get_log_details(run_id: str):
    """
    Returns detailed request/response data for a specific run.
    
    Used for the log details modal - shows full API request/response bodies
    for debugging purposes.
    
    Args:
        run_id: Unique run identifier
    
    Returns:
        dict: Detailed request/response information
    """
    # In production, this would search through daily log files to find the run
    # For now, return dummy detailed data
    
    return {
        "run_id": run_id,
        "timestamp": datetime.now().isoformat(),
        "accounts": [
            {
                "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "account_name": "Starling - 8246",
                "fetch_request": {
                    "method": "GET",
                    "url": "https://bankaccountdata.gocardless.com/api/v2/accounts/3fa85f64-5717-4562-b3fc-2c963f66afa6/transactions/",
                    "headers": {
                        "Authorization": "Bearer eyJ***" # Truncated for security
                    },
                    "params": {
                        "date_from": "2025-01-15",
                        "date_to": "2025-01-16"
                    }
                },
                "fetch_response": {
                    "status": 200,
                    "duration_ms": 1200,
                    "body": {
                        "transactions": {
                            "booked": [
                                {
                                    "transactionId": "tx_001",
                                    "bookingDate": "2025-01-15",
                                    "valueDate": "2025-01-15",
                                    "transactionAmount": {
                                        "amount": "-12.50",
                                        "currency": "GBP"
                                    },
                                    "creditorName": "Tesco Stores",
                                    "remittanceInformationUnstructured": "Card payment"
                                }
                            ],
                            "pending": []
                        }
                    }
                },
                "notion_request": {
                    "method": "POST",
                    "url": "https://api.notion.com/v1/pages",
                    "headers": {
                        "Authorization": "Bearer secret_***",
                        "Notion-Version": "2022-06-28"
                    },
                    "body": {
                        "parent": {"database_id": "abc123"},
                        "properties": {
                            "Date": {"date": {"start": "2025-01-15"}},
                            "Amount": {"number": -12.50},
                            "Merchant": {"title": [{"text": {"content": "Tesco Stores"}}]}
                        }
                    }
                },
                "notion_response": {
                    "status": 200,
                    "duration_ms": 980,
                    "body": {
                        "object": "page",
                        "id": "notion_page_id_123",
                        "created_time": "2025-01-15T10:30:00Z"
                    }
                }
            }
        ]
    }
