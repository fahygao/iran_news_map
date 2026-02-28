"""Telegram Bot alerts for critical/high severity events."""

import logging
import requests as http_requests

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, FRONTEND_URL

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"

SEVERITY_EMOJI = {
    "critical": "\U0001F534",  # red circle
    "high": "\U0001F7E0",      # orange circle
}


def _format_event(e: dict) -> str:
    severity = e["severity"].upper()
    emoji = SEVERITY_EMOJI.get(e["severity"], "\u26AA")
    headline = e["headline"][:120]
    source = e.get("source_name", "Unknown")
    url = e.get("source_url", "")
    location = e.get("location_name", "")
    loc_str = f" | {location}" if location else ""
    return f"{emoji} <b>[{severity}]</b> {headline}\n<i>{source}{loc_str}</i>\n{url}"


def send_telegram_alert(events: list[dict]) -> bool:
    """Send Telegram alert for critical/high severity events.

    Returns True if sent successfully.
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.info("Telegram not configured, skipping")
        return False

    if not events:
        return False

    header = f"\U0001F6A8 <b>Iran News Alert</b> \u2014 {len(events)} new event(s)\n"
    divider = "\u2500" * 30 + "\n"

    body_parts = []
    for e in events[:10]:
        body_parts.append(_format_event(e))

    if len(events) > 10:
        body_parts.append(f"\n... and {len(events) - 10} more")

    footer = f'\n<a href="{FRONTEND_URL}">View on Map \u2192</a>'

    text = header + divider + "\n\n".join(body_parts) + footer

    try:
        resp = http_requests.post(
            TELEGRAM_API.format(token=TELEGRAM_BOT_TOKEN),
            json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": text,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
            timeout=10,
        )
        if resp.status_code == 200:
            logger.info(f"Telegram alert sent: {len(events)} events")
            return True
        else:
            logger.error(f"Telegram API error {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return False
