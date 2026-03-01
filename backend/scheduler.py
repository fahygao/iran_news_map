"""Background scheduler: runs news fetch every 30 minutes.

Usage:
    python scheduler.py

For production on PythonAnywhere, use their built-in Scheduled Tasks
instead of this script (point to: python tasks/fetch_news.py).
"""

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from apscheduler.schedulers.blocking import BlockingScheduler
from log_config import setup_logging
from tasks.fetch_news import run_fetch

setup_logging()
logger = logging.getLogger(__name__)

scheduler = BlockingScheduler()


@scheduler.scheduled_job("interval", minutes=30, id="fetch_news")
def scheduled_fetch():
    logger.info("Scheduled fetch triggered")
    run_fetch()


if __name__ == "__main__":
    logger.info("Starting scheduler — fetch every 30 minutes")
    logger.info("Press Ctrl+C to stop")
    # Run immediately on startup, then every 30 min
    run_fetch()
    scheduler.start()
