"""Translate news text to Chinese using googletrans. Failures never block the pipeline."""

import logging

logger = logging.getLogger(__name__)

try:
    from googletrans import Translator

    _translator = Translator()
except Exception:
    _translator = None
    logger.warning("googletrans not available — translations will be skipped")


def translate_text(text: str, dest: str = "zh-cn") -> str:
    """Translate a single string. Returns original on any failure."""
    if not text or not _translator:
        return text
    try:
        result = _translator.translate(text, dest=dest)
        return result.text
    except Exception as e:
        logger.debug(f"Translation failed for '{text[:40]}...': {e}")
        return text


def translate_event(event: dict) -> dict:
    """Add headline_zh and summary_zh keys to an event dict."""
    event["headline_zh"] = translate_text(event.get("headline", ""))
    summary = event.get("summary")
    event["summary_zh"] = translate_text(summary) if summary else None
    return event
