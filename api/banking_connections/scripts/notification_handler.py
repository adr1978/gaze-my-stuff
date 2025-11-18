"""
GoCardless Bank Connection Reconfirmation Notification Handler

Standalone script that:
- Checks all bank connections daily
- Sends email notifications when connections enter 14-day reconfirmation window
- Tracks notification status to avoid duplicates

Usage:
  python notification_handler.py              # Normal run
  python notification_handler.py --dry-run    # Test without sending emails
  python notification_handler.py --test       # Send test email
  python notification_handler.py --force      # Force check even if recently run
"""

import json
import os
import sys
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path to import gc_client
sys.path.insert(0, str(Path(__file__).parent))
from gc_client import get_nordigen_client

# Configuration
BASE_DIR = Path(__file__).parent
METADATA_FILE = BASE_DIR / "gc_metadata.json"
LOG_DIR = BASE_DIR.parent.parent.parent / "logs"
LOG_FILE = LOG_DIR / "notifications.log"
TEMPLATE_FILE = BASE_DIR / "templates" / "email_reconfirm.html"

# Email Configuration - UPDATE THESE
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "broomfield.tech@gmail.com"  # Your Gmail address
SMTP_PASSWORD = "dpfm afda ylkv dblk"  # Gmail app password (not regular password!)
EMAIL_FROM = "Broomfield Notifications <broomfield.tech@gmail.com>"
EMAIL_TO = "thumbed_lava.0n@icloud.com"  # Where to send notifications

# Notification Settings
RECONFIRM_WINDOW_DAYS = 14  # Notify if within 14 days of expiry (before or after)
CONNECTION_VALIDITY_DAYS = 90  # EUA validity period
LANDING_PAGE_URL = "http://192.168.1.70:6059/gc"  # Your landing page URL

# Setup logging
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


def load_notification_metadata():
    """Load notification tracking data from JSON file."""
    if not METADATA_FILE.exists():
        return {}
    
    try:
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        logger.error(f"metadata file corrupted, creating backup and starting fresh")
        # Create backup
        backup_file = METADATA_FILE.with_suffix('.json.bak')
        METADATA_FILE.rename(backup_file)
        return {}
    except Exception as e:
        logger.error(f"Error loading metadata: {e}")
        return {}


def save_notification_metadata(metadata_data):
    """Save notification tracking data to JSON file."""
    try:
        # Create backup before writing
        if METADATA_FILE.exists():
            backup_file = METADATA_FILE.with_suffix('.json.bak')
            with open(METADATA_FILE, 'r') as f:
                backup_data = f.read()
            with open(backup_file, 'w') as f:
                f.write(backup_data)
        
        # Write new data
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata_data, f, indent=2)
        
        logger.info("metadata data saved successfully")
    except Exception as e:
        logger.error(f"Error saving metadata: {e}")


def calculate_days_remaining(created_date_str):
    """Calculate days remaining until connection expires."""
    try:
        created_date = datetime.fromisoformat(created_date_str.replace('Z', '+00:00'))
        expiry_date = created_date + timedelta(days=CONNECTION_VALIDITY_DAYS)
        today = datetime.now(created_date.tzinfo)
        days_remaining = (expiry_date - today).days
        return days_remaining
    except Exception as e:
        logger.error(f"Error calculating days remaining: {e}")
        return None


def check_expiring_connections(dry_run=False):
    """Check all connections and identify which need notifications."""
    logger.info("Starting connection expiry check")
    
    try:
        # Get Nordigen client and fetch requisitions
        client = get_nordigen_client()
        requisitions = client.requisition.get_requisitions()
        results = requisitions.get("results", [])
        
        logger.info(f"Found {len(results)} total connections")
        
        # Load existing metadata
        metadata = load_notification_metadata()
        
        connections_to_notify = []
        
        for req in results:
            req_id = req.get("id")
            reference = req.get("reference", "Unknown")
            created = req.get("created")
            agreement_id = req.get("agreement")
            
            if not created:
                logger.warning(f"Connection {reference} has no created date, skipping")
                continue
            
            # Calculate days remaining
            days_remaining = calculate_days_remaining(created)
            
            if days_remaining is None:
                continue
            
            # Check if in reconfirmation window
            in_window = -RECONFIRM_WINDOW_DAYS <= days_remaining <= RECONFIRM_WINDOW_DAYS
            
            if in_window:
                # Check if already notified
                if req_id in metadata and metadata[req_id].get('notification'):
                    notif = metadata[req_id]['notification']
                    logger.info(f"Connection {reference} already notified on {notif['notified_at']}")
                else:
                    logger.info(f"Connection {reference} needs notification (days remaining: {days_remaining})")
                    connections_to_notify.append({
                        'id': req_id,
                        'reference': reference,
                        'created': created,
                        'days_remaining': days_remaining,
                        'agreement_id': agreement_id
                    })
        
        logger.info(f"Connections requiring notification: {len(connections_to_notify)}")
        
        return connections_to_notify, metadata
        
    except Exception as e:
        logger.error(f"Error checking connections: {e}")
        return [], {}


def load_email_template():
    """Load HTML email template."""
    try:
        with open(TEMPLATE_FILE, 'r') as f:
            return f.read()
    except FileNotFoundError:
        logger.error(f"Email template not found: {TEMPLATE_FILE}")
        # Return basic fallback template
        return """
        <html>
        <body>
            <h2>Bank Connection Expiring Soon</h2>
            <p>Your bank connection "{reference}" expires in {days_remaining} days.</p>
            <p><a href="{landing_url}" style="background: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reconfirm Connection</a></p>
        </body>
        </html>
        """


def send_reconfirmation_email(connection, dry_run=False):
    """Send reconfirmation email for a specific connection."""
    reference = connection['reference']
    days_remaining = connection['days_remaining']
    
    logger.info(f"Preparing email for {reference} (days: {days_remaining})")
    
    # Load and populate template
    template = load_email_template()
    
    # Determine urgency
    if days_remaining < 0:
        urgency = "expired"
        urgency_color = "#d32f2f"
        days_text = f"Expired {abs(days_remaining)} days ago"
    elif days_remaining <= 7:
        urgency = "urgent"
        urgency_color = "#FF9800"
        days_text = f"Expires in {days_remaining} days"
    else:
        urgency = "warning"
        urgency_color = "#856404"
        days_text = f"Expires in {days_remaining} days"
    
    # Populate template
    email_html = template.format(
        reference=reference,
        days_remaining=days_remaining,
        days_text=days_text,
        urgency_color=urgency_color,
        landing_url=LANDING_PAGE_URL
    )
    
    # Create email
    subject = f"⚠️ Bank Connection Expiring in {days_remaining} days - Reconfirm Now"
    
    if dry_run:
        logger.info(f"[DRY RUN] Would send email:")
        logger.info(f"  To: {EMAIL_TO}")
        logger.info(f"  Subject: {subject}")
        logger.info(f"  Days remaining: {days_remaining}")
        return True
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = EMAIL_FROM
        msg['To'] = EMAIL_TO
        msg['Subject'] = subject
        
        # Attach HTML content
        html_part = MIMEText(email_html, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully for {reference}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email for {reference}: {e}")
        return False


def send_test_email():
    """Send a test email with dummy data."""
    logger.info("Sending test email")
    
    test_connection = {
        'reference': 'test_connection_demo',
        'days_remaining': 10,
        'agreement_id': 'test-agreement-123'
    }
    
    return send_reconfirmation_email(test_connection, dry_run=False)


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Check bank connections and send reconfirmation notifications')
    parser.add_argument('--dry-run', action='store_true', help='Run without sending emails or updating metadata')
    parser.add_argument('--test', action='store_true', help='Send test email')
    parser.add_argument('--force', action='store_true', help='Force check even if recently run')
    
    args = parser.parse_args()
    
    logger.info("=" * 50)
    logger.info("Starting GoCardless Reconfirmation Notification Check")
    
    if args.test:
        logger.info("Test mode: Sending test email")
        success = send_test_email()
        if success:
            logger.info("Test email sent successfully!")
        else:
            logger.error("Failed to send test email")
        return
    
    # Check connections
    connections_to_notify, metadata = check_expiring_connections(dry_run=args.dry_run)
    
    if not connections_to_notify:
        logger.info("No connections require notification")
        return
    
    # Send notifications
    sent_count = 0
    failed_count = 0
    
    for connection in connections_to_notify:
        success = send_reconfirmation_email(connection, dry_run=args.dry_run)
        
        if success:
            sent_count += 1
            
            if not args.dry_run:
                # Update notification in metadata
                if connection['id'] not in metadata:
                    metadata[connection['id']] = {
                        "reference": connection['reference'],
                        "owner": "Unknown",
                        "created_at": datetime.now().isoformat()
                    }

                metadata[connection['id']]['notification'] = {
                    'notified_at': datetime.now().isoformat(),
                    'days_remaining': connection['days_remaining'],
                    'created_date': connection['created']
                }
        else:
            failed_count += 1
    
    # Save updated metadata
    if not args.dry_run and sent_count > 0:
        save_notification_metadata(metadata)
    
    logger.info(f"Notification run complete: {sent_count} sent, {failed_count} failed")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()