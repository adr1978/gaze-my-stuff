"""
Notion Image Uploader
Handles uploading files to Notion's internal storage via the API.
Uses the 'external_url' mode to have Notion fetch and store the image.
"""
import logging
import time
import requests
from .notion_config import NOTION_API_KEY, NOTION_VERSION

logger = logging.getLogger(__name__)

def upload_image_from_url(image_url: str) -> str:
    """
    Initiates a file upload in Notion from an external URL.
    Polls until the upload is complete and returns the File ID.
    
    Args:
        image_url (str): The public URL of the image to upload.
        
    Returns:
        str: The Notion File Upload ID, or None if failed.
    """
    if not image_url:
        return None

    # Endpoint for Notion File Uploads
    upload_endpoint = "https://api.notion.com/v1/file_uploads"
    
    # Headers - Note: This endpoint is separate from the standard Client
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json"
    }
    
    # 1. Prepare Payload
    # We attempt to infer a filename/extension, defaulting to jpg if unknown
    try:
        filename = image_url.split("/")[-1].split("?")[0]
        if not filename or "." not in filename:
            filename = "recipe_image.jpg"
    except Exception:
        filename = "recipe_image.jpg"
        
    ext = filename.split(".")[-1].lower()
    # Map common extensions to mime types
    mime_map = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg", 
        "png": "image/png", "webp": "image/webp", "gif": "image/gif"
    }
    content_type = mime_map.get(ext, "image/jpeg")

    payload = {
        "mode": "external_url",
        "external_url": image_url,
        "filename": filename,
        "content_type": content_type
    }

    try:
        # 2. Initiate Upload
        logger.info(f"Initiating Notion upload for: {filename}")
        response = requests.post(upload_endpoint, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        file_id = data.get("id")
        status = data.get("status")
        
        if not file_id:
            logger.error("No file ID returned from Notion upload init.")
            return None

        # 3. Poll for Completion
        # Notion fetches the external URL asynchronously. We must wait for 'uploaded'.
        max_retries = 15
        for attempt in range(max_retries):
            if status == "uploaded":
                logger.info(f"✅ Image uploaded successfully (ID: {file_id})")
                return file_id
            
            if status == "failed":
                error_info = data.get("file_import_result", "Unknown error")
                logger.error(f"❌ Notion upload failed: {error_info}")
                return None
            
            # Wait with exponential backoff (1s, 1.5s, 2s...)
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