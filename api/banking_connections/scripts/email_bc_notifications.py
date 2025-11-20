"""
Bank Connection Reconfirmation Notification Utilities

Handles checking connections for reconfirmation windows and sending
styled email notifications. Uses configuration from .env similar to
email_notifications.py for consistency.
"""
import os
import json
import smtplib
import logging
import argparse
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration (using .env variables for consistency) ---
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "Broomfield Notifications <notifications@local.com>")
SMTP_TO_EMAIL = os.getenv("SMTP_TO_EMAIL", "recipient@example.com") # Note: Single recipient for simplicity
EMAIL_ENABLED = os.getenv("EMAIL_NOTIFICATIONS_ENABLED", "false").lower() == "true"

# Notification Settings
RECONFIRM_WINDOW_DAYS = 14  # Notify if within 14 days of expiry (before or after)
CONNECTION_VALIDITY_DAYS = 90  # EUA validity period
LANDING_PAGE_URL = os.getenv("LANDING_PAGE_URL", "http://localhost:6059/bank-connections")

# Setup logging
# Note: Assuming transaction_config setup or equivalent is available, but duplicating basic config here for standalone use
LOG_DIR = Path(__file__).parent.parent.parent.parent / "logs"
LOG_FILE = LOG_DIR / "bc_notifications.log"
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Add parent directory to path to import gc_client
sys.path.insert(0, str(Path(__file__).parent))
try:
    from gc_client import get_nordigen_client
except ImportError:
    # Fallback for running without full API setup (e.g., --test mode)
    logger.warning("gc_client module not found. Connection checking functionality disabled.")
    def get_nordigen_client():
        raise NotImplementedError("gc_client is not available.")


# --- File Paths ---
BASE_DIR = Path(__file__).parent
METADATA_FILE = BASE_DIR.parent / "data" / "gc_metadata.json"


def load_notification_metadata():
    """Load notification tracking data from JSON file."""
    if not METADATA_FILE.exists():
        return {}
    
    try:
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading metadata: {e}")
        return {}


def save_notification_metadata(metadata_data):
    """Save notification tracking data to JSON file."""
    try:
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata_data, f, indent=2)
        logger.info("Metadata data saved successfully")
    except Exception as e:
        logger.error(f"Error saving metadata: {e}")


def calculate_days_remaining(created_date_str):
    """Calculate days remaining until connection expires."""
    try:
        created_date = datetime.fromisoformat(created_date_str.replace('Z', '+00:00'))
        expiry_date = created_date + timedelta(days=CONNECTION_VALIDITY_DAYS)
        # Use timezone-aware comparison
        today = datetime.now(created_date.tzinfo)
        days_remaining = (expiry_date - today).days
        return days_remaining
    except Exception as e:
        logger.error(f"Error calculating days remaining: {e}")
        return None


def generate_email_html(connection: Dict) -> str:
    """
    Generates the styled HTML body for the reconfirmation email.
    Uses inline CSS based on the application's HSL color scheme (converted to Hex).
    """
    reference = connection['reference']
    days_remaining = connection['days_remaining']
    landing_url = LANDING_PAGE_URL

    # Determine urgency parameters and Hex colors
    if days_remaining < 0:
        urgency = "expired"
        icon = "🚨"
        days_text = f"Connection Expired {abs(days_remaining)} Day(s) Ago"
        # Destructive (0 75% 55%) -> #D32F2F
        primary_color = "#D32F2F" 
        banner_color = "#FBDDDA" # Muted Destructive
        text_color = "#D32F2F"
    elif days_remaining <= 7:
        urgency = "urgent"
        icon = "⚠️"
        days_text = f"Expires in {days_remaining} Day(s)"
        # Warning (38 95% 52%) -> #FAAA3D
        primary_color = "#FAAA3D"
        banner_color = "#FFFBEA" # Muted Warning
        text_color = "#856404"
    else:
        urgency = "warning"
        icon = "⏳"
        days_text = f"Expires in {days_remaining} Day(s)"
        # Primary (215 85% 55%) -> #3D88E3
        primary_color = "#3D88E3"
        banner_color = "#EBF5FF" # Muted Accent/Primary
        text_color = "#3D88E3"

    # Core Colors (Hex conversions from src/index.css light mode)
    BG_COLOR = "#F4F8FC"      # background: 215 25% 97%
    CARD_BG = "#FBFDFF"       # card: 215 30% 99%
    FOREGROUND_TEXT = "#243243" # foreground: 215 20% 15%
    BORDER_COLOR = "#E4E7EB"  # border: 215 20% 88%
    MUTED_TEXT = "#6C7A89"    # muted-foreground: 215 10% 45%
    BUTTON_BG = primary_color
    BUTTON_TEXT = "#FFFFFF"

    # HTML structure (Card Layout)
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{icon} Bank Connection Reconfirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; background-color: {BG_COLOR}; color: {FOREGROUND_TEXT};">
    <!-- Main container for centering -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: {BG_COLOR};">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <!-- Card Container (Max Width 600px) -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: {CARD_BG}; border-radius: 8px; border: 1px solid {BORDER_COLOR}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    
                    <!-- Header with icon and status text -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: {banner_color}; border-bottom: 1px solid {BORDER_COLOR}; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600; color: {text_color};">
                                {icon} {days_text}
                            </p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 30px 30px;">
                            <h1 style="color: {FOREGROUND_TEXT}; font-size: 22px; margin-top: 0; margin-bottom: 20px;">
                                Bank Connection Reconfirmation
                            </h1>
                            <p style="color: {FOREGROUND_TEXT}; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
                                Your connection for **{reference}** requires re-authentication. 
                                This is standard for security and ensures continuous, seamless transaction syncing.
                            </p>
                            <p style="color: {FOREGROUND_TEXT}; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                                Please complete the reconfirmation process using the link below:
                            </p>

                            <!-- Call to Action Button -->
                            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 30px auto;">
                                <tr>
                                    <td align="center" style="border-radius: 6px; background-color: {BUTTON_BG};">
                                        <a href="{landing_url}" target="_blank" style="font-size: 16px; text-decoration: none; color: {BUTTON_TEXT}; padding: 12px 25px; border-radius: 6px; display: inline-block; font-weight: 600;">
                                            Re-authenticate Connection
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Important Note -->
                            <div style="padding: 15px; border-left: 3px solid {primary_color}; background-color: {banner_color}; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; color: {MUTED_TEXT};">
                                    <strong style="color: {FOREGROUND_TEXT};">Note:</strong> Connections that expire will stop syncing data until re-authenticated.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 30px; border-top: 1px solid {BORDER_COLOR}; color: {MUTED_TEXT}; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                            <p style="margin: 0;">Sent by Broomfield Notifications. View <a href="{landing_url}" style="color: {primary_color}; text-decoration: none;">Bank Connections</a>.</p>
                        </td>
                    </tr>
                </table>
                <!-- End Card Container -->
            </td>
        </tr>
    </table>
</body>
</html>
    """
    return html_content


def _send_email(subject: str, html_body: str):
    """Internal function to send email via SMTP, consistent with email_notifications.py"""
    if not EMAIL_ENABLED or not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning(f"Email sending disabled or configuration incomplete. Subject: {subject}")
        return

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SMTP_FROM_EMAIL
        msg['To'] = SMTP_TO_EMAIL
        
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email '{subject}': {e}")


def send_reconfirmation_notification(connection: Dict, dry_run: bool = False):
    """Sends a reconfirmation email for a specific connection."""
    reference = connection['reference']
    days_remaining = connection['days_remaining']
    
    # Determine subject line based on urgency
    if days_remaining < 0:
        subject = f"🚨 Action Required: Connection Expired ({reference})"
    elif days_remaining <= 7:
        subject = f"⚠️ Urgent: Connection Expires in {days_remaining} day(s) ({reference})"
    else:
        subject = f"⏳ Reminder: Connection Expires in {days_remaining} day(s) ({reference})"
    
    email_html = generate_email_html(connection)
    
    if dry_run:
        logger.info(f"[DRY RUN] Would send email:")
        logger.info(f"  To: {SMTP_TO_EMAIL}")
        logger.info(f"  Subject: {subject}")
        return True
    
    _send_email(subject, email_html)
    return True


def check_expiring_connections(dry_run: bool = False) -> (List[Dict], Dict):
    """Check all connections and identify which need notifications."""
    logger.info("Starting connection expiry check")
    
    try:
        client = get_nordigen_client()
        requisitions = client.requisition.get_requisitions()
        results = requisitions.get("results", [])
    except NotImplementedError:
        logger.warning("Skipping real API call. gc_client not found.")
        return [], load_notification_metadata()
    except Exception as e:
        logger.error(f"Error fetching requisitions from GoCardless: {e}")
        return [], load_notification_metadata()
    
    logger.info(f"Found {len(results)} total connections")
    metadata = load_notification_metadata()
    connections_to_notify = []
    
    for req in results:
        req_id = req.get("id")
        reference = req.get("reference", "Unknown")
        created = req.get("created")
        
        if not created: continue
        
        days_remaining = calculate_days_remaining(created)
        if days_remaining is None: continue
        
        # Check if in reconfirmation window (-14 days to +14 days)
        in_window = -RECONFIRM_WINDOW_DAYS <= days_remaining <= RECONFIRM_WINDOW_DAYS
        
        if in_window:
            # Check if already notified to avoid spamming
            if req_id in metadata and metadata[req_id].get('notification'):
                notif = metadata[req_id]['notification']
                if abs(days_remaining) == abs(notif.get('days_remaining', 99)):
                    logger.info(f"Connection {reference} already notified for {days_remaining} days remaining.")
                    continue
            
            logger.info(f"Connection {reference} requires notification (days remaining: {days_remaining})")
            connections_to_notify.append({
                'id': req_id,
                'reference': reference,
                'created': created,
                'days_remaining': days_remaining
            })
            
    return connections_to_notify, metadata


def send_test_notification():
    """Send a test email with dummy data covering all cases."""
    logger.info("Sending test email notification")
    
    test_connections = [
        {'reference': 'Test Bank Account - Urgent', 'days_remaining': 5, 'created': (datetime.now() - timedelta(days=85)).isoformat()},
        {'reference': 'Test Credit Card - Warning', 'days_remaining': 12, 'created': (datetime.now() - timedelta(days=78)).isoformat()},
        {'reference': 'Test Savings - Expired', 'days_remaining': -2, 'created': (datetime.now() - timedelta(days=92)).isoformat()},
    ]
    
    success_count = 0
    for connection in test_connections:
        if send_reconfirmation_notification(connection, dry_run=False):
            success_count += 1
            
    if success_count == len(test_connections):
        logger.info(f"Successfully sent {success_count} test emails (Urgent, Warning, Expired).")
        return True
    else:
        logger.error(f"Failed to send all test emails. Sent {success_count}/{len(test_connections)}.")
        return False


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description='Check bank connections and send reconfirmation notifications')
    parser.add_argument('--dry-run', action='store_true', help='Run without sending emails or updating metadata')
    parser.add_argument('--test', action='store_true', help='Send test email')
    
    args = parser.parse_args()
    
    logger.info("=" * 50)
    logger.info("Starting Bank Connection Reconfirmation Check")
    
    if args.test:
        return send_test_notification()
    
    connections_to_notify, metadata = check_expiring_connections(dry_run=args.dry_run)
    
    if not connections_to_notify:
        logger.info("No connections require notification")
        return
    
    sent_count = 0
    
    for connection in connections_to_notify:
        if send_reconfirmation_notification(connection, dry_run=args.dry_run):
            sent_count += 1
            
            if not args.dry_run:
                req_id = connection['id']
                # Ensure the metadata entry exists
                if req_id not in metadata:
                    metadata[req_id] = {"reference": connection['reference'], "owner": "Unknown"}
                    
                # Update notification timestamp/status
                metadata[req_id]['notification'] = {
                    'notified_at': datetime.now().isoformat(),
                    'days_remaining': connection['days_remaining'],
                    'created_date': connection['created']
                }
    
    # Save updated metadata
    if not args.dry_run and sent_count > 0:
        save_notification_metadata(metadata)
    
    logger.info(f"Notification run complete: {sent_count} successfully processed.")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()