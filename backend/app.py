import json
from datetime import datetime, timedelta, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

import config
import models

app = Flask(__name__)
CORS(app, origins=["https://iran-news-map.vercel.app", "http://localhost:3000"])

models.init_db()


@app.after_request
def add_cache_headers(response):
    if request.method == "GET":
        response.headers["Cache-Control"] = f"public, max-age={config.CACHE_MAX_AGE}"
    return response


def _default_since():
    return (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()


def _validate_category(cat):
    if cat and cat not in config.CATEGORIES:
        return False
    return True


def _validate_severity(sev):
    if sev and sev not in config.SEVERITY_LEVELS:
        return False
    return True


@app.route("/api/status")
def api_status():
    sources = models.get_source_status()
    last_updated = None
    for s in sources.values():
        if s.get("last_fetched_at"):
            if not last_updated or s["last_fetched_at"] > last_updated:
                last_updated = s["last_fetched_at"]

    total_events = 0
    conn = models.get_db()
    row = conn.execute("SELECT COUNT(*) FROM news_events").fetchone()
    total_events = row[0]

    alerts_today = conn.execute(
        "SELECT COUNT(*) FROM alerts WHERE sent_at >= datetime('now', '-1 day')"
    ).fetchone()[0]
    conn.close()

    return jsonify(
        {
            "status": "healthy",
            "last_updated": last_updated,
            "sources": {
                k: {
                    "last_fetched": v.get("last_fetched_at"),
                    "is_healthy": bool(v.get("is_healthy")),
                    "article_count": v.get("article_count", 0),
                }
                for k, v in sources.items()
            },
            "total_events": total_events,
            "alerts_sent_today": alerts_today,
        }
    )


@app.route("/api/events")
def api_events():
    category = request.args.get("category")
    severity = request.args.get("severity")
    since = request.args.get("since", _default_since())
    limit = min(int(request.args.get("limit", 50)), 100)
    offset = int(request.args.get("offset", 0))

    if not _validate_category(category):
        return (
            jsonify(
                {
                    "error": f"Invalid category. Must be one of: {', '.join(config.CATEGORIES)}"
                }
            ),
            400,
        )
    if not _validate_severity(severity):
        return (
            jsonify(
                {
                    "error": f"Invalid severity. Must be one of: {', '.join(config.SEVERITY_LEVELS)}"
                }
            ),
            400,
        )

    events, total = models.get_events(category, severity, since, limit, offset)

    return jsonify(
        {
            "events": [_serialize_event(e) for e in events],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    )


@app.route("/api/events/geo")
def api_events_geo():
    category = request.args.get("category")
    severity = request.args.get("severity")
    since = request.args.get("since", _default_since())

    if not _validate_category(category):
        return (
            jsonify(
                {
                    "error": f"Invalid category. Must be one of: {', '.join(config.CATEGORIES)}"
                }
            ),
            400,
        )
    if not _validate_severity(severity):
        return (
            jsonify(
                {
                    "error": f"Invalid severity. Must be one of: {', '.join(config.SEVERITY_LEVELS)}"
                }
            ),
            400,
        )

    events = models.get_geo_events(category, severity, since)

    features = []
    for e in events:
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [e["longitude"], e["latitude"]],
                },
                "properties": {
                    "id": e["id"],
                    "headline": e["headline"],
                    "summary": e.get("summary"),
                    "source_name": e["source_name"],
                    "source_url": e["source_url"],
                    "published_at": e["published_at"],
                    "category": e["category"],
                    "severity": e["severity"],
                    "location_name": e.get("location_name"),
                    "image_url": e.get("image_url"),
                    "marker_type": e.get("marker_type", "default"),
                    "origin_latitude": e.get("origin_latitude"),
                    "origin_longitude": e.get("origin_longitude"),
                    "origin_name": e.get("origin_name"),
                },
            }
        )

    return jsonify({"type": "FeatureCollection", "features": features})


@app.route("/api/events/timeline")
def api_events_timeline():
    days = min(int(request.args.get("days", 7)), 30)
    category = request.args.get("category")
    severity = request.args.get("severity")

    if not _validate_category(category):
        return (
            jsonify(
                {
                    "error": f"Invalid category. Must be one of: {', '.join(config.CATEGORIES)}"
                }
            ),
            400,
        )
    if not _validate_severity(severity):
        return (
            jsonify(
                {
                    "error": f"Invalid severity. Must be one of: {', '.join(config.SEVERITY_LEVELS)}"
                }
            ),
            400,
        )

    events = models.get_timeline_events(days, category, severity)

    grouped = {}
    for e in events:
        date_key = e["published_at"][:10]
        if date_key not in grouped:
            grouped[date_key] = []
        grouped[date_key].append(
            {
                "id": e["id"],
                "headline": e["headline"],
                "published_at": e["published_at"],
                "category": e["category"],
                "severity": e["severity"],
                "location_name": e.get("location_name"),
            }
        )

    timeline = [
        {"date": date, "events": evts}
        for date, evts in sorted(grouped.items())
    ]

    return jsonify({"timeline": timeline})


def _serialize_event(e: dict) -> dict:
    return {
        "id": e["id"],
        "headline": e["headline"],
        "summary": e.get("summary"),
        "source_name": e["source_name"],
        "source_url": e["source_url"],
        "published_at": e["published_at"],
        "category": e["category"],
        "severity": e["severity"],
        "latitude": e.get("latitude"),
        "longitude": e.get("longitude"),
        "location_name": e.get("location_name"),
        "location_approximate": bool(e.get("location_approximate", True)),
        "image_url": e.get("image_url"),
        "data_source": e["data_source"],
        "marker_type": e.get("marker_type", "default"),
        "origin_latitude": e.get("origin_latitude"),
        "origin_longitude": e.get("origin_longitude"),
        "origin_name": e.get("origin_name"),
    }


@app.route("/api/fetch", methods=["POST"])
def api_trigger_fetch():
    """Manually trigger a news fetch cycle."""
    try:
        from tasks.fetch_news import run_fetch
        run_fetch()
        return jsonify({"status": "ok", "message": "Fetch completed"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=config.FLASK_ENV == "development", port=5001)
