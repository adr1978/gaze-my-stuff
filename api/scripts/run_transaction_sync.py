"""
Transaction sync orchestration script

Runs the full transaction sync process:
1. Fetch transactions from GoCardless
2. Transform and enrich data
3. Upload to Notion
4. Log all API calls

Can be run manually or via cron job.

Usage:
    python api/scripts/run_transaction_sync.py
    python api/scripts/run_transaction_sync.py --dry-run
    python api/scripts/run_transaction_sync.py --account-id acc_xyz123
    python api/scripts/run_transaction_sync.py --test-data api/TEMP/gcResponses/transactions_curr.json
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.banking_transactions.transaction_main import sync_transactions, main

if __name__ == "__main__":
    main()
