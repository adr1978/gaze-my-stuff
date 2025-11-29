"""
FastAPI Main Application Entry Point

This file initializes the FastAPI application and registers all endpoint routers.
Includes CORS middleware to allow requests from the React frontend.

Development server: http://192.168.1.70:6059
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys

from banking_transactions.endpoints import sync_logs, sync_stats, sync_config
from webhook_monitor.endpoints import get_webhooks, receive_webhook
from api_monitor.endpoints import monitor_stats, monitor_logs
from recipe_importer.endpoints import analyse
from banking_connections.endpoints import requisition_router, account_router
from investments_tracker.endpoints import update_transactions # Import the new investments router
from recipe_importer.endpoints import sync_recipes # Import new endpoint

# Initialize FastAPI application
app = FastAPI(
    title="Transaction Sync API",
    description="API for monitoring finances, sync jobs and Notion uploads",
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

# --- Static File Serving for Investments Data (CSVs) ---
# MOUNTING AT ORIGINAL PATH: /api/investments_tracker/data
# This matches the folder structure and the original frontend requests.
base_dir = os.path.dirname(os.path.abspath(__file__))
investments_data_path = os.path.join(base_dir, "investments_tracker", "data")

if os.path.exists(investments_data_path):
    # Mount at the exact path the frontend expects
    app.mount("/api/investments_tracker/data", StaticFiles(directory=investments_data_path), name="investments_tracker_data")
    #print(f"DEBUG: Mounted static files at /api/investments_tracker/data", file=sys.stderr)
else:
    print(f"WARNING: Investments data directory not found at {investments_data_path}", file=sys.stderr)

# Register transaction monitoring endpoints
# All routes will be prefixed with /api/transactions
app.include_router(sync_logs.router, prefix="/api/transactions", tags=["logs"])
app.include_router(sync_stats.router, prefix="/api/transactions", tags=["stats"])
app.include_router(sync_config.router, prefix="/api/transactions", tags=["config"])

# Register banking connections (GoCardless) endpoints
app.include_router(requisition_router, prefix="/api", tags=["gocardless"])
app.include_router(account_router, prefix="/api", tags=["gocardless"])

# Register webhook monitoring endpoints
app.include_router(get_webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(receive_webhook.router, prefix="/api/webhooks", tags=["webhooks"])

# Register API monitor endpoints
app.include_router(monitor_stats.router, prefix="/api/api_monitor", tags=["api_monitor"])
app.include_router(monitor_logs.router, prefix="/api/api_monitor", tags=["api_monitor"])

# Register recipe endpoints
app.include_router(analyse.router, prefix="/api/recipe", tags=["recipe"])
app.include_router(sync_recipes.router, prefix="/api/recipe", tags=["Recipe Sync"])

# Import and register new recipe endpoints
from recipe_importer.endpoints import parse_waitrose, upload_whisk
app.include_router(parse_waitrose.router, prefix="/api/recipe", tags=["recipe"])
app.include_router(upload_whisk.router, prefix="/api/recipe", tags=["recipe"])

# Register investments tracker endpoints
# This handles the JSON read/write for purchases
app.include_router(update_transactions.router, prefix="/api/investments", tags=["investments"])

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