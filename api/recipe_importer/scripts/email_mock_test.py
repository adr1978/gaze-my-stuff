"""
simulate_email.py
Run this script to send a test email with dummy data covering all status types.
Usage: python api/recipe_importer/scripts/simulate_email.py
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# 1. Ensure we can import the sibling module
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

# 2. Load Environment variables (to get SMTP settings)
# Assuming .env is in the project root (3 levels up from here)
env_path = current_dir.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Force enable notifications for this test, regardless of .env setting
os.environ["WHISK_EMAIL_NOTIFICATIONS_ENABLED"] = "true"

try:
    from email_notifier import send_sync_report
except ImportError:
    print("❌ Could not import email_notifier. Make sure this script is in 'api/recipe_importer/scripts/'")
    sys.exit(1)

# 3. Define Mock Data with all status types
mock_stats = {
    "created": 3,
    "updated": 12,
    "matched": 45,
    "deleted": 0,
    "rejected": 2,
    "errors": 2,
    "rejection_details": [
        {
            "id": "recipe_123_sample", # Fake ID
            "name": "Spicy Thai Basil Chicken",
            "reason": "Missing Ingredients list"
        },
        {
            "id": "recipe_456_sample",
            "name": "Classic Beef Wellington",
            "reason": "Source URL is invalid or unreachable"
        }
    ],
    "error_details": [
        {
            "id": "recipe_789_sample",
            "name": "Chocolate Lava Cake",
            "error": "TimeoutError: Failed to fetch image from external source"
        },
        {
            "id": "recipe_000_sample",
            "name": "Grandma's Secret Sauce",
            "error": "KeyError: 'instructions' field missing in API response"
        }
    ]
}

# 4. Trigger the Email
print("🚀 Sending simulation email...")
print(f"   - Rejections: {len(mock_stats['rejection_details'])}")
print(f"   - Errors:     {len(mock_stats['error_details'])}")

try:
    send_sync_report(mock_stats)
    print("\n✅ Simulation complete! Check your inbox.")
except Exception as e:
    print(f"\n❌ Simulation failed: {e}")