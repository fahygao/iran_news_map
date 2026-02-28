from __future__ import annotations

import re
import random
import logging

logger = logging.getLogger(__name__)

# Iranian cities and strategic locations geocoding lookup
IRAN_CITIES = {
    # Major cities
    "tehran": (35.6892, 51.3890),
    "isfahan": (32.6546, 51.6680),
    "esfahan": (32.6546, 51.6680),
    "tabriz": (38.0800, 46.2919),
    "shiraz": (29.5918, 52.5837),
    "mashhad": (36.2605, 59.6168),
    "ahvaz": (31.3183, 48.6706),
    "kerman": (30.2839, 57.0834),
    "qom": (34.6399, 50.8759),
    "bushehr": (28.9234, 50.8203),
    "bandar abbas": (27.1865, 56.2808),
    "kermanshah": (34.3142, 47.0650),
    "yazd": (31.8974, 54.3569),
    "hamadan": (34.7988, 48.5146),
    "abadan": (30.3392, 48.3043),
    "dezful": (32.3816, 48.4016),
    "khorramshahr": (30.4404, 48.1661),
    "rasht": (37.2808, 49.5832),
    "urmia": (37.5527, 45.0761),
    "sari": (36.5633, 53.0601),
    "gorgan": (36.8427, 54.4439),
    # Nuclear/military sites
    "natanz": (33.5131, 51.7272),
    "fordow": (34.8838, 51.0572),
    "arak": (34.0917, 49.6892),
    "parchin": (35.5300, 51.7700),
    "chabahar": (25.2919, 60.6430),
    "kharg island": (29.2333, 50.3167),
    "strait of hormuz": (26.5667, 56.2500),
    "hormuz": (26.5667, 56.2500),
    "persian gulf": (26.0, 52.0),
    # Related conflict locations
    "iraq": (33.2232, 43.6793),
    "baghdad": (33.3152, 44.3661),
    "damascus": (33.5138, 36.2765),
    "syria": (35.0, 38.0),
    "beirut": (33.8938, 35.5018),
    "lebanon": (33.8547, 35.8623),
    "yemen": (15.5527, 48.5164),
    "sanaa": (15.3694, 44.1910),
    "jerusalem": (31.7683, 35.2137),
    "tel aviv": (32.0853, 34.7818),
    "washington": (38.9072, -77.0369),
    "pentagon": (38.8719, -77.0563),
    "white house": (38.8977, -77.0365),
    "strait": (26.5667, 56.2500),
    # Key provinces/regions
    "khuzestan": (31.3, 49.0),
    "kurdistan": (35.9, 47.0),
    "sistan": (30.0, 61.5),
    "baluchestan": (27.0, 62.0),
}

IRAN_CENTROID = (32.4279, 53.6880)

# Regional spread points - when an event matches only "iran"/"iranian",
# distribute it across major regions instead of all at the centroid
IRAN_SPREAD_POINTS = [
    (35.6892, 51.3890, "Tehran Region"),        # Tehran
    (32.6546, 51.6680, "Isfahan Region"),        # Isfahan
    (38.0800, 46.2919, "Northwest Iran"),        # Tabriz
    (29.5918, 52.5837, "Southern Iran"),         # Shiraz
    (36.2605, 59.6168, "Northeast Iran"),        # Mashhad
    (31.3183, 48.6706, "Western Iran"),          # Ahvaz
    (28.9234, 50.8203, "Gulf Coast"),            # Bushehr
    (27.1865, 56.2808, "Hormuz Region"),         # Bandar Abbas
    (34.6399, 50.8759, "Central Iran"),          # Qom
    (30.2839, 57.0834, "Eastern Iran"),          # Kerman
]

# Severity keyword patterns
SEVERITY_KEYWORDS = {
    "critical": [
        r"\bkilled\b", r"\bbombing\b", r"\bairstrike\b", r"\bmassacre\b",
        r"\bexplosion\b", r"\bdead\b", r"\bfatalities\b", r"\bcasualties\b",
        r"\bsuicide\s+bomb", r"\bcar\s+bomb",
    ],
    "high": [
        r"\battack\b", r"\bclash\b", r"\braid\b", r"\bwounded\b",
        r"\bshelling\b", r"\bambush\b", r"\bfiring\b", r"\bmilitant\b",
        r"\bgunfire\b", r"\brocket\b",
    ],
    "medium": [
        r"\btension\b", r"\bprotest\b", r"\bsanction\b", r"\bnegotiat",
        r"\bunrest\b", r"\bdemonstrat", r"\bstandoff\b", r"\bthreat\b",
    ],
    "low": [
        r"\bstatement\b", r"\bmeeting\b", r"\btalks\b", r"\bagreement\b",
        r"\bpeace\b", r"\bdiplomat", r"\bvisit\b", r"\baid\b",
    ],
}

# Category keyword patterns
CATEGORY_KEYWORDS = {
    "conflict": [
        r"\bwar\b", r"\bfight\b", r"\bbattle\b", r"\bcombat\b",
        r"\bconflict\b", r"\bviolence\b", r"\bclash\b", r"\bassault\b",
    ],
    "military": [
        r"\bmilitary\b", r"\btroops\b", r"\bsoldier\b", r"\barmy\b",
        r"\bairforce\b", r"\bnavy\b", r"\bpentagon\b", r"\bdefense\b",
        r"\bdrone\b", r"\bairstrike\b", r"\bdeployment\b",
    ],
    "diplomatic": [
        r"\bdiplomat\b", r"\bambassador\b", r"\btreaty\b", r"\bnegotiat",
        r"\bsummit\b", r"\bUN\b", r"\bunited\s+nations\b", r"\bembassy\b",
    ],
    "political": [
        r"\bparliament\b", r"\belection\b", r"\bgovernment\b", r"\bprime\s+minister\b",
        r"\bpolitical\b", r"\blegislat", r"\bvote\b", r"\bopposition\b",
    ],
    "humanitarian": [
        r"\brefugee\b", r"\bhumanitarian\b", r"\bdisplaced\b", r"\baid\b",
        r"\brelief\b", r"\bcivilian\b", r"\bfamine\b", r"\bcrisis\b",
    ],
}

# CAMEO code to category mapping (for GDELT events)
CAMEO_CATEGORY_MAP = {
    "18": "conflict", "19": "conflict", "20": "conflict",
    "15": "military", "17": "military",
    "01": "diplomatic", "02": "diplomatic", "03": "diplomatic",
    "04": "diplomatic", "05": "diplomatic", "06": "diplomatic",
    "10": "political", "11": "political", "12": "political",
    "13": "political", "14": "political",
    "07": "humanitarian", "08": "humanitarian", "09": "humanitarian",
}

# Marker type keyword patterns
MARKER_TYPE_KEYWORDS = {
    "rocket": [r"\brocket\b", r"\bmissile\b", r"\bballistic\b", r"\bICBM\b", r"\bprojectile\b", r"\blaunch\b"],
    "explosion": [r"\bexplosion\b", r"\bbombing\b", r"\bbombed\b", r"\bblast\b", r"\bstrike\b", r"\bairstrike\b", r"\bshelling\b"],
    "fire": [r"\bwar\b", r"\bconflict\b", r"\bbattle\b", r"\bcombat\b", r"\bfight\b", r"\bclash\b", r"\bviolence\b"],
}

# Actor locations for attack route detection
ACTOR_LOCATIONS = {
    "us": (38.9, -77.0, "United States"),
    "america": (38.9, -77.0, "United States"),
    "american": (38.9, -77.0, "United States"),
    "iran": (35.7, 51.4, "Iran"),
    "iranian": (35.7, 51.4, "Iran"),
    "israel": (31.8, 35.2, "Israel"),
    "israeli": (31.8, 35.2, "Israel"),
    "hezbollah": (33.9, 35.5, "Lebanon"),
    "houthi": (15.4, 44.2, "Yemen"),
}


def classify_severity(text: str, goldstein_scale: float | None = None) -> str:
    """Classify event severity from GoldsteinScale or keyword analysis."""
    if goldstein_scale is not None:
        if goldstein_scale <= -7.0:
            return "critical"
        elif goldstein_scale <= -4.0:
            return "high"
        elif goldstein_scale <= -1.0:
            return "medium"
        else:
            return "low"

    text_lower = text.lower()
    for severity, patterns in SEVERITY_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return severity

    return "medium"


def classify_category(text: str, cameo_code: str | None = None) -> str:
    """Classify event category from CAMEO code or keyword analysis."""
    if cameo_code:
        prefix = cameo_code[:2]
        if prefix in CAMEO_CATEGORY_MAP:
            return CAMEO_CATEGORY_MAP[prefix]

    text_lower = text.lower()
    scores = {}
    for category, patterns in CATEGORY_KEYWORDS.items():
        score = 0
        for pattern in patterns:
            if re.search(pattern, text_lower):
                score += 1
        if score > 0:
            scores[category] = score

    if scores:
        return max(scores, key=scores.get)

    return "conflict"


def classify_marker_type(text: str) -> str:
    """Classify marker type based on content keywords.

    Returns "rocket", "explosion", "fire", or "default".
    """
    text_lower = text.lower()
    for marker_type, patterns in MARKER_TYPE_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return marker_type
    return "default"


ATTACK_ACTION_PATTERNS = [
    r"\bstrike[sd]?\b", r"\bstruck\b", r"\bairstrike", r"\bbomb(?:ed|ing|s)\b",
    r"\blaunch(?:ed|es|ing)\b", r"\bfired?\b", r"\bshell(?:ed|ing)\b",
    r"\bmissile", r"\brocket", r"\battack(?:ed|s|ing)\b",
    r"\binvad(?:ed|es|ing)\b", r"\braid(?:ed|s)?\b",
]


def detect_attack_route(text: str, marker_type: str) -> tuple[float | None, float | None, str | None]:
    """Detect the origin of a military strike based on actor + action keywords.

    Only assigns an origin when the text describes an actual attack/strike/launch,
    not general news mentions. Requires marker_type to be "rocket" or "explosion".

    Returns (origin_lat, origin_lon, origin_name) or (None, None, None).
    """
    # Only draw routes for actual strike/missile events
    if marker_type not in ("rocket", "explosion"):
        return None, None, None

    text_lower = text.lower()

    # Must contain an attack-action verb
    has_action = any(re.search(p, text_lower) for p in ATTACK_ACTION_PATTERNS)
    if not has_action:
        return None, None, None

    for actor, (lat, lon, name) in ACTOR_LOCATIONS.items():
        if re.search(rf"\b{actor}\b", text_lower):
            return lat, lon, name
    return None, None, None


def geocode_from_text(text: str) -> tuple[float | None, float | None, str | None]:
    """Extract geolocation from text by matching city/location names.

    Returns (latitude, longitude, location_name) or (None, None, None).
    Adds small jitter to prevent exact overlapping markers.
    """
    text_lower = text.lower()

    for city, (lat, lon) in IRAN_CITIES.items():
        if city in text_lower:
            # Add small jitter so markers don't perfectly overlap
            jitter_lat = random.uniform(-0.15, 0.15)
            jitter_lon = random.uniform(-0.15, 0.15)
            return lat + jitter_lat, lon + jitter_lon, city.title()

    if any(word in text_lower for word in ["iran", "iranian"]):
        # Spread across major regions instead of all at centroid
        point = random.choice(IRAN_SPREAD_POINTS)
        jitter_lat = random.uniform(-0.5, 0.5)
        jitter_lon = random.uniform(-0.5, 0.5)
        return point[0] + jitter_lat, point[1] + jitter_lon, point[2]

    return None, None, None


def classify_event(event: dict) -> dict:
    """Apply severity, category, marker type, attack route, and geolocation classification."""
    text = f"{event.get('headline', '')} {event.get('summary', '')}"

    event["severity"] = classify_severity(
        text, event.get("goldstein_scale")
    )
    event["category"] = classify_category(
        text, event.get("cameo_code")
    )
    event["marker_type"] = classify_marker_type(text)

    origin_lat, origin_lon, origin_name = detect_attack_route(text, event["marker_type"])
    event["origin_latitude"] = origin_lat
    event["origin_longitude"] = origin_lon
    event["origin_name"] = origin_name

    if not event.get("latitude") or not event.get("longitude"):
        lat, lon, loc_name = geocode_from_text(text)
        if lat is not None:
            event["latitude"] = lat
            event["longitude"] = lon
            event["location_name"] = loc_name
            event["location_approximate"] = 1

    return event
