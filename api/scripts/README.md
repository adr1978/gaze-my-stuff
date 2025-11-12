# Transaction Sync Scripts

This directory contains the Python scripts that fetch bank transactions from GoCardless and upload them to Notion.

## Scripts Overview

### 1. `fetch_transactions.py`
**Purpose**: Fetch transactions from GoCardless API for all enabled accounts.

**What it does**:
- Loads enabled accounts from `src/data/gc_metadata.json`
- Fetches transactions for the last 7 days from each account
- Writes results to daily log files in `api/data/transactions/logs/`
- Updates `summary.json` with run statistics

**Run manually**:
```bash
python api/scripts/fetch_transactions.py
```

**Cron schedule**: `0 */6 * * *` (4 times daily at 00:00, 06:00, 12:00, 18:00)

**Environment variables required**:
- `GOCARDLESS_SECRET_TOKEN`: Your GoCardless API secret token

**Output files**:
- `api/data/transactions/logs/YYYY-MM-DD.json`: Daily log with all runs
- `api/data/transactions/summary.json`: Updated summary statistics

---

### 2. `enrich_and_upload.py`
**Purpose**: Enrich transactions and upload to Notion database.

**What it does**:
- Loads the most recent fetch run from today's log
- Enriches transactions with:
  - Category (based on merchant keywords)
  - Cleaned merchant name
- Uploads each transaction to Notion database
- Updates log file with Notion upload status

**Run manually**:
```bash
python api/scripts/enrich_and_upload.py
```

**Should run**: Immediately after `fetch_transactions.py` completes

**Environment variables required**:
- `NOTION_SECRET_TOKEN`: Your Notion integration token
- `NOTION_TRANSACTIONS_DB_ID`: Your Notion database ID

**Output files**:
- Updates existing `api/data/transactions/logs/YYYY-MM-DD.json` with Notion results

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd api
pip install -r requirements.txt
```

### 2. Set Environment Variables
Create a `.env` file in the `api/` directory:

```bash
# GoCardless API
GOCARDLESS_SECRET_TOKEN=your_secret_token_here

# Notion API
NOTION_SECRET_TOKEN=secret_xxxxxxxxxxxxxxxxxxxx
NOTION_TRANSACTIONS_DB_ID=your_database_id_here
```

**Finding your Notion database ID**:
1. Open your Notion database in a browser
2. Copy the URL: `https://www.notion.so/{workspace}/{database_id}?v=...`
3. The database_id is the 32-character string

### 3. Configure Notion Database
Your Notion database must have these properties:

| Property Name | Type | Description |
|--------------|------|-------------|
| Merchant | Title | Merchant name |
| Date | Date | Transaction date |
| Amount | Number | Transaction amount |
| Category | Select | Transaction category |
| Account | Select | Bank account name |
| Currency | Select | Currency (GBP, EUR, etc.) |
| Description | Text | Transaction description |
| Transaction ID | Text | Unique transaction ID |

### 4. Test Manually
Run the fetch script first:
```bash
python api/scripts/fetch_transactions.py
```

Then run the enrichment script:
```bash
python api/scripts/enrich_and_upload.py
```

Check `api/data/transactions/logs/` for log files.

---

## Automation (Cron Setup)

### Option 1: QNAP NAS Cron
1. SSH into your QNAP NAS
2. Edit crontab: `crontab -e`
3. Add these lines:

```cron
# Fetch transactions 4 times daily
0 */6 * * * cd /path/to/api && python scripts/fetch_transactions.py && python scripts/enrich_and_upload.py

# Optional: Clean old logs monthly (keep last 90 days)
0 0 1 * * find /path/to/api/data/transactions/logs -name "*.json" -mtime +90 -delete
```

### Option 2: Docker Container Cron
If running in a Docker container, add to your Dockerfile:

```dockerfile
# Install cron
RUN apt-get update && apt-get install -y cron

# Add crontab file
COPY crontab /etc/cron.d/transaction-sync
RUN chmod 0644 /etc/cron.d/transaction-sync
RUN crontab /etc/cron.d/transaction-sync

# Start cron in background
CMD cron && uvicorn main:app --host 0.0.0.0 --port 6059
```

---

## Data Flow Diagram

```
gc_metadata.json (enabled accounts)
         ↓
[fetch_transactions.py]
         ↓
    GoCardless API
         ↓
   Daily Log File (raw fetch results)
         ↓
[enrich_and_upload.py]
         ↓
  Transaction Enrichment (categories, cleaning)
         ↓
     Notion API
         ↓
   Daily Log File (updated with Notion status)
         ↓
    Frontend Dashboard (displays logs via FastAPI)
```

---

## Troubleshooting

### "No recent fetch run found"
- Ensure `fetch_transactions.py` ran successfully first
- Check that today's log file exists in `api/data/transactions/logs/`

### "GoCardless API 401 Unauthorized"
- Verify `GOCARDLESS_SECRET_TOKEN` is set correctly
- Check token hasn't expired - reconfirm connections if needed

### "Notion API 400 Bad Request"
- Verify database properties match the expected schema
- Check that `NOTION_TRANSACTIONS_DB_ID` is correct
- Ensure Notion integration has access to the database

### "Category always showing as 'Other'"
- Edit `categorize_transaction()` function to add more keywords
- Consider implementing ML-based categorization for better accuracy

### Log files growing too large
- Implement log rotation (keep last 90 days)
- Add cron job to clean old files:
  ```bash
  find api/data/transactions/logs -name "*.json" -mtime +90 -delete
  ```

---

## Future Enhancements

1. **Email notifications on errors**
   - Add SMTP configuration
   - Send email when `status == "error"`
   - Include error_body in email for debugging

2. **Better categorization**
   - Use ML model (e.g., scikit-learn)
   - Learn from user corrections in Notion
   - API integration with external categorization service

3. **Duplicate detection**
   - Track processed transaction IDs
   - Skip transactions already in Notion
   - Prevent duplicate uploads

4. **Retry logic**
   - Retry failed uploads automatically
   - Exponential backoff for rate limits
   - Queue failed transactions for later retry

5. **Transaction storage**
   - Store raw transaction data in SQLite database
   - Enable faster lookups and analysis
   - Support historical data queries
