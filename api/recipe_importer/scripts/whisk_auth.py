"""
Whisk Authentication Module
"""

import json
import time
import os
import requests
from pathlib import Path
import logging
from dotenv import load_dotenv

load_dotenv()

TOKEN_FILE = Path(__file__).parent.parent / "data" / "whisk_token.json"

# Use the shared logger name "whisk_importer"
logger = logging.getLogger("whisk_importer")

ANON_URL = "https://login.whisk.com/x/v1/auth/anonymous/create"
LOGIN_URL = "https://login.whisk.com/x/v1/auth/login"

WHISK_CLIENT_ID = os.getenv("WHISK_CLIENT_ID", "")
WHISK_EMAIL = os.getenv("WHISK_EMAIL", "")
WHISK_PASSWORD = os.getenv("WHISK_PASSWORD", "")

def save_token(token_data: dict):
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f)

def load_token() -> dict:
    if TOKEN_FILE.exists():
        with open(TOKEN_FILE, "r") as f:
            return json.load(f)
    return {}

def get_anonymous_token() -> tuple[str, str]:
    logger.info("  -> Requesting new anonymous token...")
    payload = {"user_params": {"language": "en-GB", "locate": True}}
    headers = {"x-whisk-client-id": WHISK_CLIENT_ID, "Content-Type": "application/json"}
    
    response = requests.post(ANON_URL, headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    return data["authenticated"]["token"]["access_token"], "anonymous"

def login_with_token(email: str, password: str, anon_token: str) -> tuple[str, str]:
    logger.info("  -> Logging in with credentials...")
    headers = {"Authorization": f"Bearer {anon_token}", "Content-Type": "application/json"}
    payload = {"email": email, "password": password}
    
    response = requests.post(LOGIN_URL, headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    token_info = data["authenticated"]["token"]
    access_token = token_info["access_token"]
    
    expires_in = int(token_info.get("expires_in", 3600))
    expires_at = time.time() + expires_in

    save_token({"access_token": access_token, "expires_at": expires_at})
    logger.info("  -> New token acquired and saved.")
    return access_token, "refreshed"

def refresh_token_if_needed(email: str, password: str) -> tuple[str, str]:
    anon_token, _ = get_anonymous_token()
    return login_with_token(email, password, anon_token)

def get_access_token() -> dict:
    """
    Main authentication function.
    Returns: {'access_token': '...', 'source': 'stored'|'refreshed'}
    """
    token_data = load_token()
    access_token = token_data.get("access_token")
    expires_at = token_data.get("expires_at", 0)
    
    if access_token and time.time() < expires_at:
        logger.info("  -> Using valid stored token.")
        return {"access_token": access_token, "source": "stored"}
    else:
        logger.info("  -> Token missing or expired. Authenticating...")
        new_token, source = refresh_token_if_needed(WHISK_EMAIL, WHISK_PASSWORD)
        return {"access_token": new_token, "source": source}