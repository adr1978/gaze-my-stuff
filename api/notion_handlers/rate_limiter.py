"""
Notion Rate Limiter
Wraps API calls to ensure compliance with Notion's rate limits (approx 3 req/sec).
Handles 429 Too Many Requests responses with exponential backoff.
"""
import time
import logging
import functools
from notion_client import APIResponseError

logger = logging.getLogger(__name__)

# Token bucket settings
MAX_TOKENS = 3.0
REFILL_RATE = 3.0  # tokens per second
tokens = MAX_TOKENS
last_refill = time.time()

def _wait_for_token():
    """Simple token bucket implementation to rate limit requests locally."""
    global tokens, last_refill
    while True:
        now = time.time()
        # Refill tokens based on time elapsed
        elapsed = now - last_refill
        if elapsed > 0:
            tokens = min(MAX_TOKENS, tokens + elapsed * REFILL_RATE)
            last_refill = now
        
        if tokens >= 1.0:
            tokens -= 1.0
            return
        
        # Wait a bit before checking again
        time.sleep(0.1)

def rate_limit(func):
    """Decorator to apply rate limiting and 429 retry logic."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # 1. Local Rate Limiting
        _wait_for_token()
        
        # 2. API Error Handling (429)
        max_retries = 5
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except APIResponseError as e:
                if e.code == 429: # Too Many Requests
                    # Notion usually provides a Retry-After header
                    retry_after = int(e.headers.get("Retry-After", 1))
                    wait_time = retry_after + (attempt * 1) # Add slight jitter
                    logger.warning(f"⚠️ Rate limited by Notion. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise e
        
        # Final attempt
        return func(*args, **kwargs)
    return wrapper