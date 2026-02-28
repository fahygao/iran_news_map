import sqlite3
import uuid
from datetime import datetime, timezone

from config import DATABASE_PATH


def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS news_events (
            id TEXT PRIMARY KEY,
            headline TEXT NOT NULL,
            summary TEXT,
            source_name TEXT NOT NULL,
            source_url TEXT NOT NULL UNIQUE,
            published_at TEXT NOT NULL,
            fetched_at TEXT NOT NULL,
            category TEXT NOT NULL,
            severity TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            location_name TEXT,
            location_approximate INTEGER NOT NULL DEFAULT 1,
            image_url TEXT,
            data_source TEXT NOT NULL,
            goldstein_scale REAL,
            cameo_code TEXT,
            marker_type TEXT NOT NULL DEFAULT 'default',
            origin_latitude REAL,
            origin_longitude REAL,
            origin_name TEXT,
            alert_sent INTEGER NOT NULL DEFAULT 0,
            alert_sent_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_events_published_at ON news_events(published_at);
        CREATE INDEX IF NOT EXISTS idx_events_severity ON news_events(severity);
        CREATE INDEX IF NOT EXISTS idx_events_category ON news_events(category);
        CREATE INDEX IF NOT EXISTS idx_events_alert_sent ON news_events(alert_sent);
        CREATE INDEX IF NOT EXISTS idx_events_source_url ON news_events(source_url);

        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            sent_at TEXT NOT NULL,
            recipient TEXT NOT NULL,
            event_count INTEGER NOT NULL,
            event_ids TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'retrying',
            retry_count INTEGER NOT NULL DEFAULT 0,
            error_message TEXT
        );

        CREATE TABLE IF NOT EXISTS data_source_status (
            source_key TEXT PRIMARY KEY,
            last_fetched_at TEXT,
            last_error TEXT,
            is_healthy INTEGER NOT NULL DEFAULT 1,
            article_count INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS predictions (
            id TEXT PRIMARY KEY,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            grid_lat REAL NOT NULL,
            grid_lng REAL NOT NULL,
            ip_hash TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_pred_grid ON predictions(grid_lat, grid_lng);
        CREATE INDEX IF NOT EXISTS idx_pred_ip ON predictions(ip_hash, created_at);
    """)
    # Seed data source status rows
    sources = ["google_news", "gdelt_geo", "gdelt_doc"]
    for src in sources:
        conn.execute(
            "INSERT OR IGNORE INTO data_source_status (source_key) VALUES (?)",
            (src,),
        )
    conn.commit()
    conn.close()


def insert_event(event: dict) -> bool:
    conn = get_db()
    try:
        conn.execute(
            """INSERT OR IGNORE INTO news_events
            (id, headline, summary, source_name, source_url, published_at, fetched_at,
             category, severity, latitude, longitude, location_name, location_approximate,
             image_url, data_source, goldstein_scale, cameo_code,
             marker_type, origin_latitude, origin_longitude, origin_name,
             alert_sent, alert_sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                event.get("id", str(uuid.uuid4())),
                event["headline"],
                event.get("summary"),
                event["source_name"],
                event["source_url"],
                event["published_at"],
                datetime.now(timezone.utc).isoformat(),
                event["category"],
                event["severity"],
                event.get("latitude"),
                event.get("longitude"),
                event.get("location_name"),
                event.get("location_approximate", 1),
                event.get("image_url"),
                event["data_source"],
                event.get("goldstein_scale"),
                event.get("cameo_code"),
                event.get("marker_type", "default"),
                event.get("origin_latitude"),
                event.get("origin_longitude"),
                event.get("origin_name"),
                0,
                None,
            ),
        )
        conn.commit()
        return conn.total_changes > 0
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_events(category=None, severity=None, since=None, limit=50, offset=0):
    conn = get_db()
    query = "SELECT * FROM news_events WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if since:
        query += " AND published_at >= ?"
        params.append(since)

    count_query = query.replace("SELECT *", "SELECT COUNT(*)")
    total = conn.execute(count_query, params).fetchone()[0]

    query += " ORDER BY published_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows], total


def get_geo_events(category=None, severity=None, since=None):
    conn = get_db()
    query = "SELECT * FROM news_events WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if since:
        query += " AND published_at >= ?"
        params.append(since)

    query += " ORDER BY published_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_timeline_events(days=7, category=None, severity=None):
    conn = get_db()
    since = datetime.now(timezone.utc).isoformat()
    query = "SELECT * FROM news_events WHERE published_at >= datetime('now', ?)"
    params = [f"-{days} days"]

    if category:
        query += " AND category = ?"
        params.append(category)
    if severity:
        query += " AND severity = ?"
        params.append(severity)

    query += " ORDER BY published_at ASC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_pending_alerts():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM news_events WHERE alert_sent = 0 AND severity IN ('critical', 'high') ORDER BY published_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_events_alerted(event_ids: list, alert_id: str):
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    for eid in event_ids:
        conn.execute(
            "UPDATE news_events SET alert_sent = 1, alert_sent_at = ? WHERE id = ?",
            (now, eid),
        )
    conn.commit()
    conn.close()


def insert_alert(alert: dict):
    conn = get_db()
    conn.execute(
        """INSERT INTO alerts (id, sent_at, recipient, event_count, event_ids, status, retry_count, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            alert["id"],
            alert["sent_at"],
            alert["recipient"],
            alert["event_count"],
            alert["event_ids"],
            alert["status"],
            alert.get("retry_count", 0),
            alert.get("error_message"),
        ),
    )
    conn.commit()
    conn.close()


def get_source_status():
    conn = get_db()
    rows = conn.execute("SELECT * FROM data_source_status").fetchall()
    conn.close()
    return {r["source_key"]: dict(r) for r in rows}


def update_source_status(source_key: str, success: bool, error: str = None):
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    if success:
        conn.execute(
            """UPDATE data_source_status
            SET last_fetched_at = ?, is_healthy = 1, last_error = NULL,
                article_count = article_count + 1
            WHERE source_key = ?""",
            (now, source_key),
        )
    else:
        conn.execute(
            """UPDATE data_source_status
            SET last_error = ?, is_healthy = 0
            WHERE source_key = ?""",
            (error, source_key),
        )
    conn.commit()
    conn.close()


import math


def _snap_to_grid(val):
    """Floor to nearest 0.5° cell."""
    return math.floor(val * 2) / 2


def insert_prediction(lat, lng, ip_hash):
    conn = get_db()
    grid_lat = _snap_to_grid(lat)
    grid_lng = _snap_to_grid(lng)
    conn.execute(
        """INSERT INTO predictions (id, latitude, longitude, grid_lat, grid_lng, ip_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            str(uuid.uuid4()),
            lat,
            lng,
            grid_lat,
            grid_lng,
            ip_hash,
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    count = conn.execute(
        "SELECT COUNT(*) FROM predictions WHERE grid_lat = ? AND grid_lng = ?",
        (grid_lat, grid_lng),
    ).fetchone()[0]
    conn.close()
    return {"cell_count": count, "grid_lat": grid_lat, "grid_lng": grid_lng}


def get_prediction_grid():
    conn = get_db()
    rows = conn.execute(
        "SELECT grid_lat, grid_lng, COUNT(*) as count FROM predictions GROUP BY grid_lat, grid_lng"
    ).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
    conn.close()
    return [dict(r) for r in rows], total


def check_rate_limit(ip_hash, max_per_hour=10):
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) FROM predictions WHERE ip_hash = ? AND created_at >= datetime('now', '-1 hour')",
        (ip_hash,),
    ).fetchone()[0]
    conn.close()
    return count >= max_per_hour


def cleanup_old_data(days: int = 90):
    conn = get_db()
    conn.execute(
        "DELETE FROM news_events WHERE fetched_at < datetime('now', ?)",
        (f"-{days} days",),
    )
    conn.execute(
        "DELETE FROM alerts WHERE sent_at < datetime('now', ?)",
        (f"-{days} days",),
    )
    conn.commit()
    conn.close()
