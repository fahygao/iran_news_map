import logging

import requests

import config

logger = logging.getLogger(__name__)

OPENSKY_URL = "https://opensky-network.org/api/states/all"


def fetch_flights() -> list[dict]:
    """Fetch live airborne aircraft positions from OpenSky within the Middle East bounding box."""
    bbox = config.OPENSKY_BBOX
    params = {
        "lamin": bbox["lamin"],
        "lomin": bbox["lomin"],
        "lamax": bbox["lamax"],
        "lomax": bbox["lomax"],
    }

    auth = None
    if config.OPENSKY_USERNAME and config.OPENSKY_PASSWORD:
        auth = (config.OPENSKY_USERNAME, config.OPENSKY_PASSWORD)

    try:
        resp = requests.get(OPENSKY_URL, params=params, auth=auth, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error(f"OpenSky fetch failed: {e}")
        return []

    states = data.get("states") or []
    flights = []
    for s in states:
        # Skip aircraft on the ground or with no position
        if s[8] or s[6] is None or s[5] is None:
            continue
        flights.append({
            "icao24": s[0],
            "callsign": (s[1] or "").strip(),
            "origin_country": s[2],
            "latitude": s[6],
            "longitude": s[5],
            "altitude": s[7],  # barometric altitude in meters
            "velocity": s[9],  # ground speed in m/s
            "heading": s[10],  # track angle in degrees
            "on_ground": s[8],
        })

    return flights
