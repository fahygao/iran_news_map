"""Safe logging configuration that handles broken pipes in production WSGI environments.

When running under PythonAnywhere or other WSGI servers, stderr/stdout pipes can
close unexpectedly, causing every logging call to raise OSError. This module
provides:
  - SafeStreamHandler: suppresses OSError on emit *and* handleError
  - SafeStream: wraps sys.stdout/sys.stderr so direct writes never raise OSError
  - setup_logging(): wires everything together with a file-based fallback
"""

import logging
import logging.handlers
import os
import sys


class SafeStream:
    """Drop-in wrapper for sys.stdout / sys.stderr that swallows broken-pipe errors.

    Any OSError raised by write() or flush() is silently suppressed so that
    library code using ``print()`` or direct ``sys.stderr.write()`` never crashes
    the WSGI worker.
    """

    def __init__(self, underlying):
        self._underlying = underlying

    # Delegate attribute access to the underlying stream
    def __getattr__(self, name):
        return getattr(self._underlying, name)

    def write(self, s):
        try:
            return self._underlying.write(s)
        except OSError:
            return 0

    def flush(self):
        try:
            self._underlying.flush()
        except OSError:
            pass


class SafeStreamHandler(logging.StreamHandler):
    """StreamHandler that silently ignores OSError (broken pipe / write error).

    Overrides both ``emit`` and ``handleError`` so that a broken stderr never
    produces traceback noise in the WSGI error log.
    """

    def emit(self, record):
        try:
            super().emit(record)
        except OSError:
            pass

    def handleError(self, record):
        # Suppress all logging-internal errors when the stream is broken.
        # The file handler will still capture the original log record.
        pass


def setup_logging():
    """Configure logging with a safe stream handler and a file-based fallback."""
    log_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    level = logging.INFO

    root = logging.getLogger()
    # Avoid adding duplicate handlers if called multiple times
    if root.handlers:
        return

    # In production, never let the logging machinery raise exceptions.
    logging.raiseExceptions = False

    root.setLevel(level)

    # Wrap stdout/stderr so that direct writes (print, library code) are safe
    if not isinstance(sys.stderr, SafeStream):
        sys.stderr = SafeStream(sys.stderr)
    if not isinstance(sys.stdout, SafeStream):
        sys.stdout = SafeStream(sys.stdout)

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
