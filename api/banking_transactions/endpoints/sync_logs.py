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
    # Use the requested date instead of today
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    except:
        target_date = datetime.now()
    
    # Set time to 8 AM on the target date
    base_time = target_date.replace(hour=8, minute=15, second=0, microsecond=0)
    
    return [
        {
            "run_id": f"run_{int(base_time.timestamp())}",
            "timestamp": base_time.isoformat(),
            "status": "success",
            "duration_ms": 4850,
            "accounts_processed": [
                {
                    "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    "owner": "John Smith",
                    "institution_name": "Starling Bank",
                    "last_four": "8246",
                    "calls": [
                        {
                            "call_id": "call_001",
                            "timestamp": base_time.isoformat(),
                            "call_type": "gocardless_fetch",
                            "http_method": "GET",
                            "url": "https://bankaccountdata.gocardless.com/api/v2/accounts/3fa85f64/transactions/",
                            "http_status": 200,
                            "duration_ms": 1200,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "params": {"date_from": date, "date_to": date}
                            },
                            "response": {
                                "body": {"transactions": {"booked": [], "pending": []}}
                            },
                            "error": None,
                            "status": "success"
                        },
                        {
                            "call_id": "call_002",
                            "timestamp": (base_time + timedelta(seconds=2)).isoformat(),
                            "call_type": "notion_create",
                            "transaction_id": "tx_001",
                            "http_method": "POST",
                            "url": "https://api.notion.com/v1/pages",
                            "http_status": 200,
                            "duration_ms": 450,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "body": {"parent": {"database_id": "xxx"}}
                            },
                            "response": {"body": {"id": "page_001"}},
                            "error": None,
                            "status": "success"
                        },
                        {
                            "call_id": "call_003",
                            "timestamp": (base_time + timedelta(seconds=3)).isoformat(),
                            "call_type": "notion_create",
                            "transaction_id": "tx_002",
                            "http_method": "POST",
                            "url": "https://api.notion.com/v1/pages",
                            "http_status": 200,
                            "duration_ms": 380,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "body": {"parent": {"database_id": "xxx"}}
                            },
                            "response": {"body": {"id": "page_002"}},
                            "error": None,
                            "status": "success"
                        },
                        {
                            "call_id": "call_004",
                            "timestamp": (base_time + timedelta(seconds=4)).isoformat(),
                            "call_type": "notion_create",
                            "transaction_id": "tx_003",
                            "http_method": "POST",
                            "url": "https://api.notion.com/v1/pages",
                            "http_status": 200,
                            "duration_ms": 420,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "body": {"parent": {"database_id": "xxx"}}
                            },
                            "response": {"body": {"id": "page_003"}},
                            "error": None,
                            "status": "success"
                        },
                        {
                            "call_id": "call_005",
                            "timestamp": (base_time + timedelta(seconds=5)).isoformat(),
                            "call_type": "notion_create",
                            "transaction_id": "tx_004",
                            "http_method": "POST",
                            "url": "https://api.notion.com/v1/pages",
                            "http_status": 200,
                            "duration_ms": 395,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "body": {"parent": {"database_id": "xxx"}}
                            },
                            "response": {"body": {"id": "page_004"}},
                            "error": None,
                            "status": "success"
                        },
                        {
                            "call_id": "call_006",
                            "timestamp": (base_time + timedelta(seconds=6)).isoformat(),
                            "call_type": "notion_create",
                            "transaction_id": "tx_005",
                            "http_method": "POST",
                            "url": "https://api.notion.com/v1/pages",
                            "http_status": 200,
                            "duration_ms": 410,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "body": {"parent": {"database_id": "xxx"}}
                            },
                            "response": {"body": {"id": "page_005"}},
                            "error": None,
                            "status": "success"
                        }
                    ],
                    "summary": {
                        "fetched": 5,
                        "new": 5,
                        "updated": 0,
                        "skipped": 0,
                        "errors": 0
                    }
                },
                {
                    "account_id": "7cb85f64-5717-4562-b3fc-2c963f66afa9",
                    "owner": "Jane Doe",
                    "institution_name": "Monzo",
                    "last_four": "4521",
                    "calls": [
                        {
                            "call_id": "call_007",
                            "timestamp": base_time.isoformat(),
                            "call_type": "gocardless_fetch",
                            "http_method": "GET",
                            "url": "https://bankaccountdata.gocardless.com/api/v2/accounts/7cb85f64/transactions/",
                            "http_status": 200,
                            "duration_ms": 890,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "params": {"date_from": date, "date_to": date}
                            },
                            "response": {
                                "body": {"transactions": {"booked": [], "pending": []}}
                            },
                            "error": None,
                            "status": "success"
                        },
                        {
                            "call_id": "call_008",
                            "timestamp": (base_time + timedelta(seconds=2)).isoformat(),
                            "call_type": "notion_create",
                            "transaction_id": "tx_006",
                            "http_method": "POST",
                            "url": "https://api.notion.com/v1/pages",
                            "http_status": 200,
                            "duration_ms": 375,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "body": {"parent": {"database_id": "xxx"}}
                            },
                            "response": {"body": {"id": "page_006"}},
                            "error": None,
                            "status": "success"
                        },
                        {
                            "call_id": "call_009",
                            "timestamp": (base_time + timedelta(seconds=3)).isoformat(),
                            "call_type": "notion_create",
                            "transaction_id": "tx_007",
                            "http_method": "POST",
                            "url": "https://api.notion.com/v1/pages",
                            "http_status": 200,
                            "duration_ms": 385,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "body": {"parent": {"database_id": "xxx"}}
                            },
                            "response": {"body": {"id": "page_007"}},
                            "error": None,
                            "status": "success"
                        }
                    ],
                    "summary": {
                        "fetched": 2,
                        "new": 2,
                        "updated": 0,
                        "skipped": 0,
                        "errors": 0
                    }
                }
            ]
        },
        {
            "run_id": f"run_{int((base_time - timedelta(hours=6)).timestamp())}",
            "timestamp": (base_time - timedelta(hours=6)).isoformat(),
            "status": "warning",
            "duration_ms": 2300,
            "accounts_processed": [
                {
                    "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    "owner": "John Smith",
                    "institution_name": "Starling Bank",
                    "last_four": "8246",
                    "calls": [
                        {
                            "call_id": "call_010",
                            "timestamp": (base_time - timedelta(hours=6)).isoformat(),
                            "call_type": "gocardless_fetch",
                            "http_method": "GET",
                            "url": "https://bankaccountdata.gocardless.com/api/v2/accounts/3fa85f64/transactions/",
                            "http_status": 200,
                            "duration_ms": 1100,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "params": {"date_from": date, "date_to": date}
                            },
                            "response": {
                                "body": {"transactions": {"booked": [], "pending": []}}
                            },
                            "error": None,
                            "status": "success"
                        },
                        {
                            "call_id": "call_011",
                            "timestamp": (base_time - timedelta(hours=6) + timedelta(seconds=2)).isoformat(),
                            "call_type": "notion_create",
                            "transaction_id": "tx_008",
                            "http_method": "POST",
                            "url": "https://api.notion.com/v1/pages",
                            "http_status": 500,
                            "duration_ms": 1200,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "body": {"parent": {"database_id": "xxx"}}
                            },
                            "response": {
                                "body": {"error": "Internal Server Error", "message": "Notion API rate limit exceeded"}
                            },
                            "error": {
                                "error": "Internal Server Error",
                                "message": "Notion API rate limit exceeded"
                            },
                            "status": "error"
                        }
                    ],
                    "summary": {
                        "fetched": 1,
                        "new": 0,
                        "updated": 0,
                        "skipped": 0,
                        "errors": 1
                    }
                }
            ]
        },
        {
            "run_id": f"run_{int((base_time - timedelta(hours=12)).timestamp())}",
            "timestamp": (base_time - timedelta(hours=12)).isoformat(),
            "status": "error",
            "duration_ms": 1500,
            "accounts_processed": [
                {
                    "account_id": "7cb85f64-5717-4562-b3fc-2c963f66afa9",
                    "owner": "Jane Doe",
                    "institution_name": "Monzo",
                    "last_four": "4521",
                    "calls": [
                        {
                            "call_id": "call_012",
                            "timestamp": (base_time - timedelta(hours=12)).isoformat(),
                            "call_type": "gocardless_fetch",
                            "http_method": "GET",
                            "url": "https://bankaccountdata.gocardless.com/api/v2/accounts/7cb85f64/transactions/",
                            "http_status": 401,
                            "duration_ms": 1500,
                            "request": {
                                "headers": {"Authorization": "Bearer ***"},
                                "params": {"date_from": date, "date_to": date}
                            },
                            "response": {
                                "body": {"error": "Unauthorized", "message": "Access token expired. Please reconfirm connection."}
                            },
                            "error": {
                                "error": "Unauthorized",
                                "message": "Access token expired. Please reconfirm connection."
                            },
                            "status": "error"
                        }
                    ],
                    "summary": {
                        "fetched": 0,
                        "new": 0,
                        "updated": 0,
                        "skipped": 0,
                        "errors": 1
                    }
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
