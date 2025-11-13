"""
Email notification utilities for transaction sync
Sends immediate error alerts and daily digest summaries
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Dict
from dotenv import load_dotenv
from .transaction_config import logger

load_dotenv()

# Email configuration from .env
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_TO_EMAIL = os.getenv("SMTP_TO_EMAIL", "")

EMAIL_ENABLED = os.getenv("EMAIL_NOTIFICATIONS_ENABLED", "false").lower() == "true"
IMMEDIATE_ERRORS = os.getenv("EMAIL_IMMEDIATE_ERRORS", "true").lower() == "true"
DAILY_DIGEST = os.getenv("EMAIL_DAILY_DIGEST", "true").lower() == "true"


def send_error_alert(run_id: str, errors: List[Dict]):
    """Send immediate email alert for sync errors"""
    if not EMAIL_ENABLED or not IMMEDIATE_ERRORS:
        return
    
    subject = f"Transaction Sync Error - {run_id}"
    body = f"""
    <h2>Transaction Sync Error Alert</h2>
    <p><strong>Run ID:</strong> {run_id}</p>
    <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    <h3>Errors:</h3>
    <ul>
    {"".join(f"<li><strong>{e['account']}:</strong> {e['message']}</li>" for e in errors)}
    </ul>
    """
    
    _send_email(subject, body)


def send_daily_digest(stats: Dict):
    """Send daily summary email"""
    if not EMAIL_ENABLED or not DAILY_DIGEST:
        return
    
    subject = f"Transaction Sync Daily Summary - {datetime.now().strftime('%Y-%m-%d')}"
    body = f"""
    <h2>Daily Transaction Sync Summary</h2>
    <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d')}</p>
    <h3>Statistics:</h3>
    <ul>
        <li>Total Runs: {stats.get('total_runs', 0)}</li>
        <li>Successful: {stats.get('successful_runs', 0)}</li>
        <li>Failed: {stats.get('failed_runs', 0)}</li>
        <li>Transactions Processed: {stats.get('total_transactions', 0)}</li>
    </ul>
    """
    
    _send_email(subject, body)


def _send_email(subject: str, html_body: str):
    """Internal function to send email via SMTP"""
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
        
        logger.info(f"Email sent: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
