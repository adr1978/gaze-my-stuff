"""
Notion Image Uploader
Handles uploading files to Notion's internal storage via the API.
Uses the 'external_url' mode to have Notion fetch and store the image.
"""
import logging
import time
import requests
import unicodedata
import re
from .notion_config import NOTION_API_KEY, NOTION_VERSION

logger = logging.getLogger(__name__)

def sanitize_filename(text):
    """
    Sanitizes a string to be safe for filenames:
    - Normalizes unicode (e.g. è -> e)
    - Lowercases
    - Replaces spaces with hyphens
    - Removes non-alphanumeric characters (except hyphens/underscores)
    """
    if not text:
        return "recipe-image"
        
    # Normalize unicode characters to ASCII approximations
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    
    # Lowercase and replace spaces
    text = text.lower().replace(' ', '-')
    
    # Remove invalid chars (keep a-z, 0-9, -, _)
    text = re.sub(r'[^a-z0-9\-_]', '', text)
    
    # Remove duplicate hyphens and leading/trailing hyphens
    text = re.sub(r'-+', '-', text).strip('-')
    
    return text or "recipe-image"

def upload_image_from_url(image_url: str, title: str = None) -> str:
    """
    Initiates a file upload in Notion from an external URL.
    Polls until the upload is complete and returns the File ID.
    
    Args:
        image_url (str): The public URL of the image to upload.
        title (str): Optional title to use for the filename.
        
    Returns:
        str: The Notion File Upload ID, or None if failed.
    """
    if not image_url:
        return None

    # Endpoint for Notion File Uploads
    upload_endpoint = "https://api.notion.com/v1/file_uploads"
    
    # Headers
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json"
    }
    
    # 1. Determine Filename
    # Extract extension from URL or default to jpg
    try:
        url_path = image_url.split("/")[-1].split("?")[0]
        if "." in url_path:
            ext = url_path.split(".")[-1].lower()
        else:
            ext = "jpg"
    except Exception:
        ext = "jpg"

    # Clean title or default
    safe_name = sanitize_filename(title)
    final_filename = f"{safe_name}.{ext}"
        
    # Map common extensions to mime types
    mime_map = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg", 
        "png": "image/png", "webp": "image/webp", "gif": "image/gif"
    }
    content_type = mime_map.get(ext, "image/jpeg")

    payload = {
        "mode": "external_url",
        "external_url": image_url,
        "filename": final_filename,
        "content_type": content_type
    }

    try:
        # 2. Initiate Upload
        logger.info(f"Initiating Notion upload: {final_filename}")
        response = requests.post(upload_endpoint, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        file_id = data.get("id")
        status = data.get("status")
        
        if not file_id:
            logger.error("No file ID returned from Notion upload init.")
            return None

        # 3. Poll for Completion
        max_retries = 15
        for attempt in range(max_retries):
            if status == "uploaded":
                logger.info(f"✅ Image uploaded successfully (ID: {file_id})")
                return file_id
            
            if status == "failed":
                error_info = data.get("file_import_result", "Unknown error")
                logger.error(f"❌ Notion upload failed: {error_info}")
                return None
            
            # Wait with exponential backoff
            sleep_time = 1 + (attempt * 0.5)
            logger.debug(f"Upload status '{status}'. Waiting {sleep_time}s...")
            time.sleep(sleep_time)
            
            # Check status
            check_resp = requests.get(f"{upload_endpoint}/{file_id}", headers=headers)
            if check_resp.status_code == 200:
                data = check_resp.json()
                status = data.get("status")
            else:
                logger.warning(f"Failed to check upload status: {check_resp.status_code}")

        logger.error(f"❌ Upload timed out after {max_retries} attempts.")
        return None

    except Exception as e:
        logger.error(f"Exception during Notion image upload: {str(e)}")
        return None