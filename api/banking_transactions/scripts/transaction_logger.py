"""
Structured logging for transaction sync operations
Writes detailed logs in format expected by the monitoring dashboard

Log Structure:
- Daily log files: /api/banking_transactions/data/logs/YYYY-MM-DD.json
- Parent row: Account summary (owner - institution (last_four))
- Child rows: Individual API calls (GoCardless GET, Notion POST/PATCH)
- Response bodies truncated to first 10 transactions to save disk space
"""
import json
import gzip
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from .transaction_config import logger

# Log file location (scripts folder -> parent -> data)
LOG_DIR = Path(__file__).parent.parent / "data" / "logs"
SUMMARY_FILE = Path(__file__).parent.parent / "data" / "summary.json"
METADATA_FILE = Path(__file__).parent.parent.parent.parent / "src" / "data" / "gc_metadata.json"


class CallLogger:
    """
    Tracks API calls during a sync run and generates structured logs
    """
    
    def __init__(self, run_id: str):
        self.run_id = run_id
        self.run_start_time = datetime.now()
        self.accounts: Dict[str, Dict] = {}
        
    def start_account(self, account_id: str, account_info: Dict):
        """
        Initialize tracking for an account
        
        Args:
            account_id: GoCardless account UUID
            account_info: Account metadata dict with institution_name, last_four, owner
        """
        self.accounts[account_id] = {
            "account_id": account_id,
            "owner": account_info.get("owner", "Unknown"),
            "institution_name": account_info.get("institution_name", "Unknown"),
            "last_four": account_info.get("last_four", "****"),
            "calls": [],
            "summary": {
                "fetched": 0,
                "new": 0,
                "updated": 0,
                "skipped": 0,
                "errors": 0
            }
        }
    
    def log_gocardless_fetch(
        self,
        account_id: str,
        request_data: Dict,
        response_data: Dict,
        http_status: int,
        duration_ms: int,
        error: Optional[Dict] = None
    ):
        """
        Log a GoCardless transaction fetch call
        
        Args:
            account_id: Account being fetched
            request_data: Request details (method, url, headers, params)
            response_data: Response body (truncated)
            http_status: HTTP status code
            duration_ms: Request duration in milliseconds
            error: Optional error dict if request failed
        """
        call_id = f"{account_id}_gc_{datetime.now().strftime('%H%M%S%f')}"
        
        # Truncate response body to first 10 transactions
        truncated_response = self._truncate_transaction_response(response_data)
        
        call_entry = {
            "call_id": call_id,
            "timestamp": datetime.now().isoformat(),
            "call_type": "gocardless_fetch",
            "http_method": request_data.get("method", "GET"),
            "url": request_data.get("url", ""),
            "http_status": http_status,
            "duration_ms": duration_ms,
            "request": {
                "headers": request_data.get("headers", {}),
                "params": request_data.get("params", {})
            },
            "response": {
                "body": truncated_response,
                "truncated": len(str(response_data)) != len(str(truncated_response))
            },
            "error": error,
            "status": "error" if error or http_status >= 400 else "success"
        }
        
        self.accounts[account_id]["calls"].append(call_entry)
        
        # Update summary
        if error or http_status >= 400:
            self.accounts[account_id]["summary"]["errors"] += 1
        else:
            # Count transactions fetched
            booked = response_data.get("transactions", {}).get("booked", [])
            pending = response_data.get("transactions", {}).get("pending", [])
            self.accounts[account_id]["summary"]["fetched"] = len(booked) + len(pending)
    
    def log_notion_upload(
        self,
        account_id: str,
        transaction_id: str,
        is_update: bool,
        request_data: Dict,
        response_data: Dict,
        http_status: int,
        duration_ms: int,
        error: Optional[Dict] = None
    ):
        """
        Log a Notion page creation/update call
        
        Args:
            account_id: Associated account
            transaction_id: Transaction being uploaded
            is_update: True if updating existing page, False if creating new
            request_data: Request details
            response_data: Response body
            http_status: HTTP status code
            duration_ms: Request duration
            error: Optional error dict
        """
        call_id = f"{account_id}_notion_{datetime.now().strftime('%H%M%S%f')}"
        
        call_entry = {
            "call_id": call_id,
            "timestamp": datetime.now().isoformat(),
            "call_type": "notion_update" if is_update else "notion_create",
            "transaction_id": transaction_id,
            "http_method": request_data.get("method", "POST"),
            "url": request_data.get("url", ""),
            "http_status": http_status,
            "duration_ms": duration_ms,
            "request": {
                "headers": request_data.get("headers", {}),
                "body": request_data.get("body", {})
            },
            "response": {
                "body": response_data
            },
            "error": error,
            "status": "error" if error or http_status >= 400 else "success"
        }
        
        self.accounts[account_id]["calls"].append(call_entry)
        
        # Update summary
        if error or http_status >= 400:
            self.accounts[account_id]["summary"]["errors"] += 1
        elif is_update:
            self.accounts[account_id]["summary"]["updated"] += 1
        else:
            self.accounts[account_id]["summary"]["new"] += 1
    
    def log_transaction_skipped(self, account_id: str):
        """Mark a transaction as skipped (already synced, no changes)"""
        self.accounts[account_id]["summary"]["skipped"] += 1
    
    def finalize_and_save(self):
        """
        Calculate overall status and save to daily log file
        """
        run_duration_ms = int((datetime.now() - self.run_start_time).total_seconds() * 1000)
        
        # Determine overall run status
        has_errors = any(acc["summary"]["errors"] > 0 for acc in self.accounts.values())
        has_successes = any(acc["summary"]["new"] > 0 or acc["summary"]["updated"] > 0 
                           for acc in self.accounts.values())
        
        if has_errors and has_successes:
            overall_status = "warning"
        elif has_errors:
            overall_status = "error"
        else:
            overall_status = "success"
        
        # Build log entry
        log_entry = {
            "run_id": self.run_id,
            "timestamp": self.run_start_time.isoformat(),
            "status": overall_status,
            "duration_ms": run_duration_ms,
            "accounts_processed": list(self.accounts.values())
        }
        
        # Save to daily log file
        self._save_to_daily_log(log_entry)
        
        # Update summary file
        self._update_summary_stats(log_entry)
        
        logger.info(f"Log saved: {overall_status} - {len(self.accounts)} accounts processed")
    
    def _truncate_transaction_response(self, response_data: Dict) -> Dict:
        """
        Truncate transaction response to first 10 transactions to save disk space
        """
        if not isinstance(response_data, dict):
            return response_data
        
        truncated = response_data.copy()
        transactions = truncated.get("transactions", {})
        
        if "booked" in transactions:
            transactions["booked"] = transactions["booked"][:10]
        if "pending" in transactions:
            transactions["pending"] = transactions["pending"][:10]
        
        truncated["transactions"] = transactions
        return truncated
    
    def _save_to_daily_log(self, log_entry: Dict):
        """
        Append log entry to today's log file
        """
        # Ensure log directory exists
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        
        # Get today's log file
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = LOG_DIR / f"{today}.json"
        
        # Load existing runs or create new
        if log_file.exists():
            with open(log_file, 'r') as f:
                data = json.load(f)
        else:
            data = {"runs": []}
        
        # Append this run
        data["runs"].append(log_entry)
        
        # Save back
        with open(log_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved log to {log_file}")
    
    def _update_summary_stats(self, log_entry: Dict):
        """
        Update rolling summary statistics in format expected by dashboard
        """
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Calculate totals from log entry
        total_transactions = sum(
            acc["summary"]["fetched"] for acc in log_entry["accounts_processed"]
        )
        
        # Load existing summary or create new
        if SUMMARY_FILE.exists():
            with open(SUMMARY_FILE, 'r') as f:
                summary = json.load(f)
        else:
            summary = {
                "today": {
                    "date": today,
                    "total_transactions": 0,
                    "successful_runs": 0,
                    "failed_runs": 0,
                    "last_run": None,
                    "next_run": None,
                    "duration_ms": 0
                },
                "active_accounts": 0,
                "last_7_days_success_rate": 0.0,
                "last_updated": None
            }
        
        # Reset if new day
        if summary.get("today", {}).get("date") != today:
            summary["today"] = {
                "date": today,
                "total_transactions": 0,
                "successful_runs": 0,
                "failed_runs": 0,
                "last_run": None,
                "next_run": None,
                "duration_ms": 0
            }
        
        # Update today's stats
        summary["today"]["total_transactions"] += total_transactions
        summary["today"]["last_run"] = log_entry["timestamp"]
        summary["today"]["duration_ms"] = log_entry["duration_ms"]
        
        if log_entry["status"] == "success":
            summary["today"]["successful_runs"] += 1
        else:
            summary["today"]["failed_runs"] += 1
        
        # Dynamically count active accounts from gc_metadata.json
        summary["active_accounts"] = self._count_active_accounts()
        
        # Calculate 7-day success rate
        summary["last_7_days_success_rate"] = self._calculate_7day_success_rate()
        
        # Update timestamp
        summary["last_updated"] = datetime.now().isoformat()
        
        # Save summary
        SUMMARY_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(SUMMARY_FILE, 'w') as f:
            json.dump(summary, f, indent=2)
    
    def _count_active_accounts(self) -> int:
        """
        Count accounts with sync_enabled=true from gc_metadata.json
        """
        try:
            if not METADATA_FILE.exists():
                logger.warning(f"Metadata file not found: {METADATA_FILE}")
                return 0
            
            with open(METADATA_FILE, 'r') as f:
                metadata = json.load(f)
            
            count = 0
            for req_id, req_data in metadata.items():
                accounts = req_data.get("accounts", [])
                for account in accounts:
                    if account.get("sync_enabled", False):
                        count += 1
            
            return count
        except Exception as e:
            logger.error(f"Error counting active accounts: {e}")
            return 0
    
    def _calculate_7day_success_rate(self) -> float:
        """
        Calculate success rate from last 7 days of log files
        """
        try:
            successful = 0
            total = 0
            
            # Look back 7 days
            for days_ago in range(7):
                date = datetime.now() - timedelta(days=days_ago)
                log_file = LOG_DIR / f"{date.strftime('%Y-%m-%d')}.json"
                
                if log_file.exists():
                    with open(log_file, 'r') as f:
                        data = json.load(f)
                    
                    for run in data.get("runs", []):
                        total += 1
                        if run.get("status") == "success":
                            successful += 1
            
            return successful / total if total > 0 else 0.0
        except Exception as e:
            logger.error(f"Error calculating 7-day success rate: {e}")
            return 0.0
