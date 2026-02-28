"""Scheduled task: fetch news from all sources, classify, deduplicate, store, and send alerts."""

import sys
import os
import logging

# Allow running from any directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fetchers.google_news import fetch_google_news
from fetchers.gdelt import fetch_gdelt_geo
from fetchers.classifier import classify_event
from models import insert_event, update_source_status, cleanup_old_data, init_db
from config import DATA_RETENTION_DAYS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def run_fetch():
    """Main fetch pipeline: fetch → classify → store → alert."""
    init_db()
    total_new = 0

    # 1. Fetch Google News RSS
    logger.info("Fetching Google News RSS...")
    try:
        google_articles = fetch_google_news()
        for article in google_articles:
            article = classify_event(article)
            if insert_event(article):
                total_new += 1
        update_source_status("google_news", True)
        logger.info(f"Google News: {len(google_articles)} fetched, new stored")
    except Exception as e:
        logger.error(f"Google News fetch failed: {e}")
        update_source_status("google_news", False, str(e))

    # 2. Fetch GDELT GEO events
    logger.info("Fetching GDELT GEO events...")
    try:
        gdelt_events = fetch_gdelt_geo()
        for event in gdelt_events:
            event = classify_event(event)
            if insert_event(event):
                total_new += 1
        update_source_status("gdelt_geo", True)
        logger.info(f"GDELT GEO: {len(gdelt_events)} fetched, new stored")
    except Exception as e:
        logger.error(f"GDELT GEO fetch failed: {e}")
        update_source_status("gdelt_geo", False, str(e))

    logger.info(f"Total new events stored: {total_new}")

    # 3. Send Telegram alerts for critical/high events
    try:
        from alerts.telegram_sender import send_telegram_alert
        from models import get_pending_alerts
        pending = get_pending_alerts()
        if pending:
            send_telegram_alert(pending)
    except Exception as e:
        logger.error(f"Telegram alert failed: {e}")

    # 4. Send email alerts for critical/high events
    try:
        from alerts.email_sender import send_pending_alerts
        send_pending_alerts()
    except ImportError:
        logger.info("Email alerts module not available, skipping")
    except Exception as e:
        logger.error(f"Email alert failed: {e}")

    # 5. Cleanup old data
    cleanup_old_data(DATA_RETENTION_DAYS)
    logger.info("Old data cleanup complete")


if __name__ == "__main__":
    run_fetch()
