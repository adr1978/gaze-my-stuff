"""
FastAPI Main Application Entry Point

This file initializes the FastAPI application and registers all endpoint routers.
Includes CORS middleware to allow requests from the React frontend.

Development server: http://192.168.1.70:6059
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from banking_transactions.endpoints import sync_logs, sync_stats, sync_config
from webhook_monitor.endpoints import get_webhooks, receive_webhook
from api_monitor.endpoints import monitor_stats, monitor_logs
from recipe_importer.endpoints import analyze
from banking_connections.endpoints import requisition_router, account_router

# Initialize FastAPI application
app = FastAPI(
    title="Transaction Sync API",
    description="API for monitoring bank transaction sync jobs and Notion uploads",
    version="1.0.0"
)

# Enable CORS for React development server and production
# Allows the frontend to make API calls from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register transaction monitoring endpoints
# All routes will be prefixed with /api/transactions
app.include_router(sync_logs.router, prefix="/api/transactions", tags=["logs"])
app.include_router(sync_stats.router, prefix="/api/transactions", tags=["stats"])
app.include_router(sync_config.router, prefix="/api/transactions", tags=["config"])

# Register banking connections (GoCardless) endpoints
# The prefix is set to /api here, and the router handles the /gc suffix, 
# resulting in the required /api/gc/... endpoints.
app.include_router(requisition_router, prefix="/api", tags=["gocardless"])
app.include_router(account_router, prefix="/api", tags=["gocardless"])

# Register webhook monitoring endpoints
app.include_router(get_webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(receive_webhook.router, prefix="/api/webhooks", tags=["webhooks"])

# Register API monitor endpoints
app.include_router(monitor_stats.router, prefix="/api/api_monitor", tags=["api_monitor"])
app.include_router(monitor_logs.router, prefix="/api/api_monitor", tags=["api_monitor"])

# Register recipe analyzer endpoints
app.include_router(analyze.router, prefix="/api/recipe", tags=["recipe"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Transaction Sync API is running"}

@app.get("/health")
async def health():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "api_version": "1.0.0",
        "endpoints": {
            "stats": "/api/transactions/stats",
            "logs": "/api/transactions/logs",
            "config": "/api/transactions/config"
        }
    }
