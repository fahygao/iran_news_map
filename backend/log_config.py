"""Safe logging configuration that handles broken pipes in production WSGI environments.

When running under PythonAnywhere or other WSGI servers, stderr/stdout pipes can
close unexpectedly, causing every logging call to raise OSError. This module
provides a SafeStreamHandler that silently ignores stream write failures and
a setup function that adds a file handler as a reliable fallback.
"""

import logging
import logging.handlers
import os
import sys


class SafeStreamHandler(logging.StreamHandler):
    """StreamHandler that silently ignores OSError (broken pipe / write error)."""

    def emit(self, record):
        try:
            super().emit(record)
        except OSError:
            pass


def setup_logging():
    """Configure logging with a safe stream handler and a file-based fallback."""
    log_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    level = logging.INFO

    root = logging.getLogger()
    # Avoid adding duplicate handlers if called multiple times
    if root.handlers:
        return

    root.setLevel(level)

    # Safe console handler (won't crash on broken pipes)
    stream_handler = SafeStreamHandler(sys.stderr)
    stream_handler.setFormatter(logging.Formatter(log_format))
    root.addHandler(stream_handler)

    # File handler as a reliable fallback
    log_dir = os.path.dirname(os.path.abspath(__file__))
    log_path = os.environ.get("LOG_FILE_PATH", os.path.join(log_dir, "app.log"))
    try:
        file_handler = logging.handlers.RotatingFileHandler(
            log_path, maxBytes=5 * 1024 * 1024, backupCount=3
        )
        file_handler.setFormatter(logging.Formatter(log_format))
        root.addHandler(file_handler)
    except OSError:
        # If we can't open the log file either, continue with just the safe stream handler
        pass
