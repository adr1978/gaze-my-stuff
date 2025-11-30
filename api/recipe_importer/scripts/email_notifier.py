"""
Email Notifier for Recipe Sync
Generates and sends HTML reports for sync results.
"""
import os
import smtplib
import logging
import base64
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("recipe_sync_job")

# Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_TO_EMAIL = os.getenv("SMTP_TO_EMAIL", "")

# Feature Flag
NOTIFICATIONS_ENABLED = os.getenv("WHISK_EMAIL_NOTIFICATIONS_ENABLED", "false").lower() == "true"

# Design Theme Colors (Calculated from project HSL variables)
COLOR_BG = "#f1f5f9"       # var(--background) / Slate 100
COLOR_CARD = "#ffffff"     # var(--card)
COLOR_TEXT = "#0f172a"     # var(--foreground) / Slate 900
COLOR_PRIMARY = "#2B7CEE"  # var(--primary) hsl(215 85% 55%) -> Calculated Hex
COLOR_MUTED = "#64748b"    # var(--muted-foreground) / Slate 500
COLOR_BORDER = "#DAE2EB"   # var(--border) hsl(215 20% 88%) -> Calculated Hex
COLOR_ERROR = "#ef4444"    # var(--destructive)
COLOR_WARNING = "#F8A310"  # var(--warning) hsl(38 95% 52%) -> Calculated Hex

# Inline SVG Definitions (Lucide Icons equivalent)
def get_svg_icon(name, color):
    if name == "triangle-alert":
        return f"""
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 8px;">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
        </svg>
        """
    elif name == "circle-x":
        return f"""
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 8px;">
            <circle cx="12" cy="12" r="10"/>
            <path d="m15 9-6 6"/>
            <path d="m9 9 6 6"/>
        </svg>
        """
    return ""

def get_logo_base64():
    """
    Reads the local Broomfield crest image and returns a base64 string.
    Path is relative to this script: ../../../src/assets/broomfield-crest.png
    """
    try:
        # Resolve path: api/recipe_importer/scripts/ -> src/assets/
        current_dir = Path(__file__).parent
        logo_path = current_dir.parent.parent.parent / "src" / "assets" / "broomfield-crest.png"
        
        if logo_path.exists():
            with open(logo_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                return f"data:image/png;base64,{encoded_string}"
    except Exception as e:
        logger.warning(f"Failed to load logo image: {e}")
    return None

def generate_email_html(stats, rejections, errors):
    """Generates the modern HTML email body."""
    
    logo_src = get_logo_base64()
    logo_html = ""
    if logo_src:
        logo_html = f"""
        <tr>
            <td align="center" style="padding-bottom: 20px;">
                <img src="{logo_src}" alt="Broomfield Crest" width="120" style="display: block; width: 120px; height: auto;">
            </td>
        </tr>
        """
    
    # Helper for rendering list items
    def render_item_row(title, detail, link=None, is_error=False):
        # Red for error, Orange for rejection
        bar_color = COLOR_ERROR if is_error else COLOR_WARNING 
        
        # Only show button if there is a link AND it is NOT an error
        action_button = ""
        if link and not is_error:
            action_button = f"""
            <a href="{link}" style="background-color: {COLOR_PRIMARY}; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; white-space: nowrap;">Fix on Whisk &rarr;</a>
            """

        # Flex layout: Text on left, Button on right, Vertically centered
        return f"""
        <div style="background-color: {COLOR_CARD}; border: 1px solid {COLOR_BORDER}; border-left: 4px solid {bar_color}; border-radius: 6px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="flex: 1; padding-right: 16px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: {COLOR_TEXT};">{title}</h4>
                    <p style="margin: 0; font-size: 13px; color: {COLOR_MUTED}; line-height: 1.4;">{detail}</p>
                </div>
                <div style="flex-shrink: 0;">
                    {action_button}
                </div>
            </div>
        </div>
        """

    # Build Rejection Sections
    rejection_html = ""
    if rejections:
        icon_svg = get_svg_icon("triangle-alert", COLOR_WARNING)
        rows = "".join([
            render_item_row(
                item['name'], 
                f"Reason: {item['reason']}", 
                f"https://app.samsungfood.com/recipes/{item['id']}/edit" if item.get('id') else None
            ) for item in rejections
        ])
        rejection_html = f"""
        <div style="margin-top: 30px;">
            <h3 style="color: {COLOR_TEXT}; font-size: 16px; border-bottom: 2px solid {COLOR_BORDER}; padding-bottom: 8px; margin-bottom: 16px; display: flex; align-items: center;">
                {icon_svg} Recipes Rejected
            </h3>
            {rows}
        </div>
        """

    # Build Error Sections
    error_html = ""
    if errors:
        icon_svg = get_svg_icon("circle-x", COLOR_ERROR)
        rows = "".join([
            render_item_row(
                item['name'], 
                f"Error: {item['error']}", 
                f"https://app.samsungfood.com/recipes/{item['id']}" if item.get('id') else None,
                is_error=True
            ) for item in errors
        ])
        error_html = f"""
        <div style="margin-top: 30px;">
            <h3 style="color: {COLOR_TEXT}; font-size: 16px; border-bottom: 2px solid {COLOR_BORDER}; padding-bottom: 8px; margin-bottom: 16px; display: flex; align-items: center;">
                {icon_svg} System Errors
            </h3>
            {rows}
        </div>
        """

    # Main Template
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recipe Sync Report</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: {COLOR_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: {COLOR_TEXT};">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        
                        {logo_html}
                        
                        <tr>
                            <td style="background-color: {COLOR_CARD}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid {COLOR_BORDER};">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 30px 40px; background-color: {COLOR_CARD}; border-bottom: 1px solid {COLOR_BORDER}; text-align: center;">
                                            <h1 style="margin: 0; font-size: 22px; color: {COLOR_PRIMARY}; font-weight: 700;">Whisk Recipe Sync Report</h1>
                                            <p style="margin: 6px 0 0 0; color: {COLOR_MUTED}; font-size: 13px;">{datetime.now().strftime('%B %d, %Y • %H:%M')}</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px;">
                                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                                                <tr>
                                                    <td align="center" style="padding: 10px; border-right: 1px solid {COLOR_BORDER};">
                                                        <div style="font-size: 24px; font-weight: 700; color: {COLOR_TEXT};">{stats.get('created', 0)}</div>
                                                        <div style="font-size: 11px; color: {COLOR_MUTED}; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Created</div>
                                                    </td>
                                                    <td align="center" style="padding: 10px; border-right: 1px solid {COLOR_BORDER};">
                                                        <div style="font-size: 24px; font-weight: 700; color: {COLOR_TEXT};">{stats.get('updated', 0)}</div>
                                                        <div style="font-size: 11px; color: {COLOR_MUTED}; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Updated</div>
                                                    </td>
                                                    <td align="center" style="padding: 10px; border-right: 1px solid {COLOR_BORDER};">
                                                        <div style="font-size: 24px; font-weight: 700; color: {COLOR_WARNING};">{stats.get('rejected', 0)}</div>
                                                        <div style="font-size: 11px; color: {COLOR_MUTED}; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Rejected</div>
                                                    </td>
                                                    <td align="center" style="padding: 10px;">
                                                        <div style="font-size: 24px; font-weight: 700; color: {COLOR_ERROR};">{stats.get('errors', 0)}</div>
                                                        <div style="font-size: 11px; color: {COLOR_MUTED}; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Errors</div>
                                                    </td>
                                                </tr>
                                            </table>

                                            {rejection_html}
                                            {error_html}

                                            {'<div style="text-align:center; padding: 30px 0; color: ' + COLOR_MUTED + '; font-size: 14px;">All recipes synced successfully. No issues found.</div>' if not rejections and not errors else ''}
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="background-color: {COLOR_BG}; padding: 15px; text-align: center; border-top: 1px solid {COLOR_BORDER};">
                                            <p style="margin: 0; font-size: 11px; color: {COLOR_MUTED};">
                                                Broomfield Home Hub • Automated Notification
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

def send_sync_report(stats):
    """Sends email if there are rejections or errors."""
    if not NOTIFICATIONS_ENABLED:
        logger.info("📧 Email notifications disabled in config.")
        return

    rejections = stats.get("rejection_details", [])
    errors = stats.get("error_details", [])

    # Only send if there's something negative to report
    if not rejections and not errors:
        logger.info("📧 No issues to report. Skipping email.")
        return

    logger.info(f"📧 Sending sync report (Rejections: {len(rejections)}, Errors: {len(errors)})...")

    subject = f"Whisk Recipe Sync Alert: {len(rejections)} Rejected, {len(errors)} Errors"
    html_body = generate_email_html(stats, rejections, errors)

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SMTP_FROM_EMAIL
        msg['To'] = SMTP_TO_EMAIL

        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info("✅ Email report sent successfully.")
    except Exception as e:
        logger.error(f"❌ Failed to send email report: {e}")