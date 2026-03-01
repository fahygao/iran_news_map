"""Gmail API email sender for news alerts."""

import base64
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import ALERT_RECIPIENT, GMAIL_CREDENTIALS_PATH, GMAIL_TOKEN_PATH, FRONTEND_URL

logger = logging.getLogger(__name__)


def _get_gmail_service():
    """Build Gmail API service using stored OAuth2 credentials."""
    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
    except ImportError:
        logger.error("Google API libraries not installed")
        return None

    SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
    creds = None

    try:
        with open(GMAIL_TOKEN_PATH, "r") as f:
            creds_data = json.load(f)
            creds = Credentials.from_authorized_user_info(creds_data, SCOPES)
    except FileNotFoundError:
        pass

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                GMAIL_CREDENTIALS_PATH, SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open(GMAIL_TOKEN_PATH, "w") as f:
            f.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def _build_digest_html(events: list[dict]) -> str:
    """Build HTML email body for alert digest."""
    severity_colors = {
        "critical": "#dc2626",
        "high": "#f97316",
        "medium": "#eab308",
        "low": "#3b82f6",
    }

    rows = ""
    for e in events:
        color = severity_colors.get(e["severity"], "#888")
        pub_date = e.get("published_at", "")[:16].replace("T", " ")
        rows += f"""
        <tr style="border-bottom:1px solid #333;">
            <td style="padding:12px 8px;">
                <span style="
                    display:inline-block;
                    padding:2px 8px;
                    border-radius:4px;
                    background:{color};
                    color:white;
                    font-size:11px;
                    font-weight:bold;
                    text-transform:uppercase;
                ">{e['severity']}</span>
            </td>
            <td style="padding:12px 8px;">
                <a href="{e.get('source_url', '#')}" style="color:#60a5fa;text-decoration:none;font-weight:600;">
                    {e['headline']}
                </a>
                <br>
                <span style="color:#9ca3af;font-size:12px;">
                    {e.get('source_name', 'Unknown')} &mdash; {pub_date}
                </span>
            </td>
        </tr>
        """

    html = f"""
    <html>
    <body style="background:#111827;color:#f3f4f6;font-family:sans-serif;padding:20px;">
        <h2 style="color:#ef4444;">Iran News Alert</h2>
        <p style="color:#9ca3af;">{len(events)} new critical/high-severity event(s) detected.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
                <tr style="border-bottom:2px solid #374151;">
                    <th style="text-align:left;padding:8px;color:#9ca3af;font-size:12px;">Severity</th>
                    <th style="text-align:left;padding:8px;color:#9ca3af;font-size:12px;">Event</th>
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
        <p style="margin-top:20px;">
            <a href="{FRONTEND_URL}" style="color:#60a5fa;text-decoration:none;">
                View on Iran News Map &rarr;
            </a>
        </p>
        <p style="color:#6b7280;font-size:11px;margin-top:30px;">
            This is an automated alert from Iran News Map.
        </p>
    </body>
    </html>
    """
    return html


def _send_email(service, subject: str, html_body: str) -> bool:
    """Send email via Gmail API to all recipients (comma-separated in config)."""
    recipients = [r.strip() for r in ALERT_RECIPIENT.split(",") if r.strip()]
    for recipient in recipients:
        message = MIMEMultipart("alternative")
        message["to"] = recipient
        message["subject"] = subject
        message.attach(MIMEText(html_body, "html"))

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        body = {"raw": raw}

        service.users().messages().send(userId="me", body=body).execute()
        logger.info(f"Email sent to {recipient}")
    return True


def send_pending_alerts():
    """Check for un-alerted critical/high events and send digest email."""
    from models import get_pending_alerts, mark_events_alerted, insert_alert

    pending = get_pending_alerts()
    if not pending:
        logger.info("No pending alerts to send")
        return

    logger.info(f"Found {len(pending)} pending alert events")

    service = _get_gmail_service()
    if not service:
        logger.error("Cannot initialize Gmail service, skipping alerts")
        return

    subject = f"Iran News Alert: {len(pending)} new critical/high events"
    html = _build_digest_html(pending)

    alert_id = str(uuid.uuid4())
    event_ids = [e["id"] for e in pending]

    max_retries = 3
    for attempt in range(max_retries):
        try:
            _send_email(service, subject, html)
            logger.info(f"Alert email sent to {ALERT_RECIPIENT}")
            mark_events_alerted(event_ids, alert_id)
            insert_alert(
                {
                    "id": alert_id,
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                    "recipient": ALERT_RECIPIENT,
                    "event_count": len(pending),
                    "event_ids": json.dumps(event_ids),
                    "status": "sent",
                    "retry_count": attempt,
                }
            )
            return
        except Exception as e:
            logger.warning(f"Alert send attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                wait = 2 ** (attempt + 1)
                logger.info(f"Retrying in {wait}s...")
                time.sleep(wait)

    logger.error(f"Failed to send alert after {max_retries} attempts")
    insert_alert(
        {
            "id": alert_id,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "recipient": ALERT_RECIPIENT,
            "event_count": len(pending),
            "event_ids": json.dumps(event_ids),
            "status": "failed",
            "retry_count": max_retries,
            "error_message": "Max retries exceeded",
        }
    )
