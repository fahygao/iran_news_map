from __future__ import annotations

import requests
import logging
import uuid
from datetime import datetime, timezone

from config import GDELT_GEO_ENDPOINT

logger = logging.getLogger(__name__)


def fetch_gdelt_geo(timespan_minutes: int = 1440) -> list[dict]:
    """Fetch geolocated Iran conflict events from GDELT GEO 2.0 API.

    Returns a list of events with lat/lon coordinates.
    """
    params = {
        "query": "iran conflict OR iran war OR tehran OR isfahan OR shiraz",
        "format": "geojson",
        "timespan": str(timespan_minutes),
    }

    try:
        resp = requests.get(GDELT_GEO_ENDPOINT, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        logger.error(f"GDELT GEO API request failed: {e}")
        return []
    except ValueError as e:
        logger.error(f"GDELT GEO API returned invalid JSON: {e}")
        return []

    features = data.get("features", [])
    events = []

    for feature in features:
        geom = feature.get("geometry", {})
        props = feature.get("properties", {})

        coords = geom.get("coordinates", [])
        if len(coords) < 2:
            continue

        longitude, latitude = coords[0], coords[1]

        html_content = props.get("html", "")
        name = props.get("name", "")
        url = _extract_url_from_html(html_content)
        headline = _extract_text_from_html(html_content) or name

        if not url:
            continue

        event = {
            "id": str(uuid.uuid4()),
            "headline": headline,
            "summary": None,
            "source_name": _extract_domain(url),
            "source_url": url,
            "published_at": datetime.now(timezone.utc).isoformat(),
            "latitude": latitude,
            "longitude": longitude,
            "location_name": name,
            "location_approximate": 0,
            "data_source": "gdelt_geo",
            "image_url": props.get("shareimage"),
        }
        events.append(event)

    logger.info(f"Fetched {len(events)} geolocated events from GDELT GEO API")
    return events


def _extract_url_from_html(html: str) -> str | None:
    """Extract the first href from GDELT's HTML property."""
    import re
    match = re.search(r'href=["\']([^"\']+)["\']', html)
    return match.group(1) if match else None


def _extract_text_from_html(html: str) -> str:
    """Extract text content from GDELT's HTML property."""
    import re
    text = re.sub(r"<[^>]+>", "", html)
    return text.strip()


def _extract_domain(url: str) -> str:
    """Extract domain name from URL for source_name."""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "")
    return domain
