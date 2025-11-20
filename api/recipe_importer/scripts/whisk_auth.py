"""
Whisk Authentication Module

Handles authentication with Samsung Food (Whisk) API.
Manages token storage and refresh cycles.

Environment Variables Required:
- WHISK_CLIENT_ID: Whisk application client ID
- WHISK_EMAIL: User email for authentication
- WHISK_PASSWORD: User password for authentication
"""

import json
import time
import os
import requests
from pathlib import Path
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ---------------------------------------------------------------------------
# Token storage and logging setup
# ---------------------------------------------------------------------------

TOKEN_FILE = Path(__file__).parent / "whisk_token.json"

logging.basicConfig(
    level=logging.INFO,  # Change to DEBUG for more detail
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Whisk endpoints and client configuration
# ---------------------------------------------------------------------------

ANON_URL = "https://login.whisk.com/x/v1/auth/anonymous/create"
LOGIN_URL = "https://login.whisk.com/x/v1/auth/login"

# Fetch sensitive data from environment variables (never hardcode!)
WHISK_CLIENT_ID = os.getenv("WHISK_CLIENT_ID", "")
WHISK_EMAIL = os.getenv("WHISK_EMAIL", "")
WHISK_PASSWORD = os.getenv("WHISK_PASSWORD", "")


# ---------------------------------------------------------------------------
# Token file helpers
# ---------------------------------------------------------------------------

def save_token(token_data: dict):
    """Save token data to a local file for reuse."""
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f)


def load_token() -> dict:
    """Load token data from file if it exists."""
    if TOKEN_FILE.exists():
        with open(TOKEN_FILE, "r") as f:
            return json.load(f)
    return {}

# ---------------------------------------------------------------------------
# Authentication functions
# ---------------------------------------------------------------------------

def get_anonymous_token() -> tuple[str, str]:
    """
    Get a new anonymous token from Whisk.
    Returns a tuple (access_token, token_source="anonymous").
    """
    payload = {
        "user_params": {
            "language": "en-GB",
            "locate": True
        }
    }
    headers = {
        "x-whisk-client-id": WHISK_CLIENT_ID,
        "Content-Type": "application/json"
    }

    logger.info("Requesting anonymous token...")
    response = requests.post(ANON_URL, headers=headers, json=payload)
    
    try:
        response.raise_for_status()
    except requests.HTTPError as e:
        # Build structured error data
        error_body = None
        try:
            error_body = response.json()
        except:
            error_body = {"raw_text": response.text}
        
        error_info = {
            "message": f"{response.status_code} {response.reason}",
            "body": error_body
        }
        e.error_info = error_info
        raise e
    
    data = response.json()
    token_info = data["authenticated"]["token"]
    anon_token = token_info["access_token"]
    
    # ❌ REMOVE THESE LINES - don't save anonymous token!
    # expires_in = int(token_info.get("expires_in", 3600))
    # expires_at = time.time() + expires_in
    # save_token({"access_token": anon_token, "expires_at": expires_at})
    
    logger.info("✅ Anonymous token obtained (not saved)")
    return anon_token, "anonymous"

def login_with_token(email: str, password: str, anon_token: str) -> tuple[str, str]:
    """Login using email/password, passing in the anonymous token."""
    headers = {
        "Authorization": f"Bearer {anon_token}",
        "Content-Type": "application/json"
    }
    payload = {"email": email, "password": password}
    response = requests.post(LOGIN_URL, headers=headers, json=payload)

    try:
        response.raise_for_status()
    except requests.HTTPError as e:
        # Build structured error data
        error_body = None
        try:
            error_body = response.json()
        except:
            error_body = {"raw_text": response.text}
        
        # Create a custom error message that includes the structured data
        error_info = {
            "message": f"{response.status_code} {response.reason}",
            "body": error_body
        }
        # Attach to exception for later extraction
        e.error_info = error_info
        raise e

    data = response.json()

    token_info = data["authenticated"]["token"]
    access_token = token_info["access_token"]
    expires_in = int(token_info.get("expires_in", 3600))
    expires_at = time.time() + expires_in

    save_token({"access_token": access_token, "expires_at": expires_at})
    logger.info("✅ Login successful, token saved to disk")
    return access_token, "refreshed"


def refresh_token_if_needed(email: str, password: str) -> tuple[str, str]:
    """
    Always performs full authentication: get anon token -> login -> return authenticated token.
    """
    logger.info("⚠️ Performing full authentication flow...")
    anon_token, _ = get_anonymous_token()
    return login_with_token(email, password, anon_token)


def authenticate() -> tuple[str, str]:
    """
    Main authentication function - checks for valid stored token, refreshes if needed.
    
    Returns:
        Tuple of (access_token, token_source) where token_source is "stored" or "refreshed"
    
    Raises:
        Exception: If authentication fails
    """
    token_data = load_token()
    access_token = token_data.get("access_token")
    expires_at = token_data.get("expires_at", 0)
    
    # Check if stored token is still valid
    if access_token and time.time() < expires_at:
        logger.info("✅ Using stored access token")
        return access_token, "stored"
    else:
        # Token expired or doesn't exist - perform full authentication
        logger.info("Token expired or missing - performing full authentication")
        return refresh_token_if_needed(WHISK_EMAIL, WHISK_PASSWORD)