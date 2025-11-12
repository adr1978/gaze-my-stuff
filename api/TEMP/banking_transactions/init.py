"""
Banking Transactions Sync Package

This makes the banking_transactions folder a proper Python package.
Exports the main functions so they can be imported from elsewhere.

Usage:
    from banking_transactions import sync_transactions, main
"""
from .transaction_main import sync_transactions, main

# Define what gets exported when someone does "from banking_transactions import *"
__all__ = ['sync_transactions', 'main']