# Webhook Monitor

This module handles incoming webhooks from various providers, logs them to JSON files, and provides endpoints to retrieve webhook history.

## Directory Structure

```
webhook_monitor/
├── __init__.py
├── data/
│   └── webhooks_log.json          # Stores webhook logs (auto-managed)
├── scripts/
│   └── logger.py                  # Centralized logging utilities
└── endpoints/
    ├── __init__.py
    ├── get_webhooks.py            # API to retrieve webhook logs
    └── receive_webhook.py         # Example webhook receiver endpoint
```

## Features

- **Centralized Logging**: All webhooks are logged to a single JSON file
- **Automatic Cleanup**: Old webhooks are automatically removed after the retention period (default: 7 days)
- **Efficient Filtering**: Frontend can request only new webhooks using `last_checked` timestamp
- **Generic Receiver**: Example endpoint that can be extended for different providers

## Configuration

Add these settings to your `.env` file:

```bash
WEBHOOK_RETENTION_DAYS=7  # Number of days to keep webhook logs
```

## Usage

### Creating Custom Webhook Endpoints

To create a webhook endpoint for a specific provider (e.g., Notion):

1. Create a new file in `endpoints/` (e.g., `notion_webhook.py`)
2. Import the logger: `from ..scripts.logger import log_webhook`
3. Process your webhook logic
4. Call `log_webhook()` to save the webhook to the log file

Example:

```python
from fastapi import APIRouter, Request
from ..scripts.logger import log_webhook

router = APIRouter()

@router.post("/webhooks/notion/category_update")
async def notion_category_update(request: Request):
    # Get webhook data
    headers = dict(request.headers)
    body = await request.json()
    
    # Process the webhook (your custom logic here)
    # ... your processing code ...
    
    # Log the webhook for monitoring
    log_webhook(
        method="POST",
        endpoint="/webhooks/notion/category_update",
        headers=headers,
        body=body,
        status_code=200,
        status_text="OK"
    )
    
    return {"status": "success"}
```

4. Register your router in `api/main.py`:

```python
from webhook_monitor.endpoints import notion_webhook

app.include_router(notion_webhook.router, prefix="/api/webhooks", tags=["webhooks"])
```

## API Endpoints

### GET /api/webhooks/webhooks
Retrieve webhook logs, optionally filtered by timestamp.

**Query Parameters:**
- `last_checked` (optional): ISO timestamp to get only webhooks newer than this

**Response:**
```json
{
  "webhooks": [...],
  "count": 5,
  "last_updated": "2025-01-15T14:32:18Z"
}
```

### POST /api/webhooks/webhooks/{provider}/{action}
Generic webhook receiver endpoint.

**Example:** `/api/webhooks/webhooks/notion/page_update`

### Test Endpoints
- `GET /api/webhooks/webhooks/test` - Test GET webhook
- `PUT /api/webhooks/webhooks/test` - Test PUT webhook
- `DELETE /api/webhooks/webhooks/test` - Test DELETE webhook

## Frontend Integration

The frontend automatically polls the API every 5 seconds when auto-refresh is enabled:

```typescript
import { webhookApi } from "@/lib/api";

// Fetch webhooks
const data = await webhookApi.getWebhooks();

// Fetch only new webhooks
const newData = await webhookApi.getWebhooks(lastCheckedTimestamp);
```

## Testing

You can test the webhook receiver using curl:

```bash
# Test POST webhook
curl -X POST http://localhost:8000/api/webhooks/webhooks/notion/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test GET webhook
curl http://localhost:8000/api/webhooks/webhooks/test

# View logged webhooks
curl http://localhost:8000/api/webhooks/webhooks
```

## Security Notes

1. **Authentication**: This example does not include authentication. For production:
   - Add Cloudflare Access or similar authentication
   - Verify webhook signatures (e.g., HMAC signatures from providers)
   - Validate client credentials in headers

2. **Rate Limiting**: Consider adding rate limiting to prevent abuse

3. **Data Retention**: Adjust `WEBHOOK_RETENTION_DAYS` based on your needs and storage capacity
