"""
FastAPI Main Application Entry Point

This file initializes the FastAPI application and registers all endpoint routers.
Includes CORS middleware to allow requests from the React frontend.

Development server: http://192.168.1.70:6059
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from banking_transactions.endpoints import sync_logs, sync_stats, sync_config

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
