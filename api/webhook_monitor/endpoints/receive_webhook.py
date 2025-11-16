"""
Webhook Receiver Endpoint

Example endpoint that demonstrates how to receive webhooks and log them.
You can create specific webhook endpoints for different providers (e.g., Notion, GitHub, etc.)
and they can all use the centralized logger.
"""

from fastapi import APIRouter, Request, Header
from typing import Optional
from ..scripts.logger import log_webhook

router = APIRouter()


@router.post("/webhooks/{provider}/{action}")
async def receive_webhook(
    provider: str,
    action: str,
    request: Request,
    user_agent: Optional[str] = Header(None),
    content_type: Optional[str] = Header(None),
):
    """
    Generic webhook receiver endpoint.
    
    Path parameters:
        provider: The provider name (e.g., 'notion', 'github', 'stripe')
        action: The action or event type (e.g., 'page_update', 'push', 'payment_success')
    
    Example URLs:
        /api/webhooks/webhooks/notion/page_update
        /api/webhooks/webhooks/github/push
        /api/webhooks/webhooks/stripe/payment_intent
    """
    # Get the full endpoint path
    endpoint = f"/webhooks/{provider}/{action}"
    
    # Get all headers
    headers = dict(request.headers)
    
    # Get the request body
    try:
        body = await request.json()
    except:
        body = await request.body()
        body = body.decode('utf-8') if body else ""
    
    # Log the webhook
    log_webhook(
        method="POST",
        endpoint=endpoint,
        headers=headers,
        body=body,
        status_code=200,
        status_text="OK"
    )
    
    # Here you would add your specific processing logic based on provider and action
    # For example:
    # if provider == "notion" and action == "page_update":
    #     process_notion_page_update(body)
    # elif provider == "github" and action == "push":
    #     process_github_push(body)
    
    return {
        "status": "success",
        "message": f"Webhook received for {provider}/{action}",
        "provider": provider,
        "action": action
    }


@router.get("/webhooks/test")
async def test_webhook_get(request: Request):
    """
    Test endpoint for GET webhooks.
    """
    endpoint = "/webhooks/test"
    headers = dict(request.headers)
    
    # Log the webhook
    log_webhook(
        method="GET",
        endpoint=endpoint,
        headers=headers,
        body={"message": "Test GET webhook"},
        status_code=200,
        status_text="OK"
    )
    
    return {"status": "success", "message": "Test GET webhook received"}


@router.put("/webhooks/test")
async def test_webhook_put(request: Request):
    """
    Test endpoint for PUT webhooks.
    """
    endpoint = "/webhooks/test"
    headers = dict(request.headers)
    
    try:
        body = await request.json()
    except:
        body = {"message": "No body provided"}
    
    # Log the webhook
    log_webhook(
        method="PUT",
        endpoint=endpoint,
        headers=headers,
        body=body,
        status_code=200,
        status_text="OK"
    )
    
    return {"status": "success", "message": "Test PUT webhook received"}


@router.delete("/webhooks/test")
async def test_webhook_delete(request: Request):
    """
    Test endpoint for DELETE webhooks.
    """
    endpoint = "/webhooks/test"
    headers = dict(request.headers)
    
    # Log the webhook
    log_webhook(
        method="DELETE",
        endpoint=endpoint,
        headers=headers,
        body={"message": "Test DELETE webhook"},
        status_code=200,
        status_text="OK"
    )
    
    return {"status": "success", "message": "Test DELETE webhook received"}
