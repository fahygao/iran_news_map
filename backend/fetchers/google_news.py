import feedparser
from datetime import datetime, timezone
import uuid
import logging

from config import GOOGLE_NEWS_QUERIES

logger = logging.getLogger(__name__)

GOOGLE_NEWS_RSS_URL = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"


def fetch_google_news() -> list[dict]:
    """Fetch Iran war news from Google News RSS for multiple keyword queries."""
    all_articles = []
    seen_urls = set()

    for query in GOOGLE_NEWS_QUERIES:
        try:
            url = GOOGLE_NEWS_RSS_URL.format(query=query.replace(" ", "+"))
            feed = feedparser.parse(url)

            if feed.bozo and not feed.entries:
                logger.warning(f"Failed to parse Google News RSS for query: {query}")
                continue

            for entry in feed.entries:
                link = entry.get("link", "")
                if not link or link in seen_urls:
                    continue
                seen_urls.add(link)

                published = entry.get("published_parsed")
                if published:
                    pub_dt = datetime(*published[:6], tzinfo=timezone.utc)
                else:
                    pub_dt = datetime.now(timezone.utc)

                source_name = "Unknown"
                if hasattr(entry, "source") and hasattr(entry.source, "title"):
                    source_name = entry.source.title
                elif entry.get("source", {}).get("title"):
                    source_name = entry["source"]["title"]

                article = {
                    "id": str(uuid.uuid4()),
                    "headline": entry.get("title", "Untitled"),
                    "summary": _clean_html(entry.get("summary", "")),
                    "source_name": source_name,
                    "source_url": link,
                    "published_at": pub_dt.isoformat(),
                    "data_source": "google_news",
                    "image_url": None,
                }
                all_articles.append(article)

            logger.info(f"Fetched {len(feed.entries)} entries for query: {query}")
        except Exception as e:
            logger.error(f"Error fetching Google News for '{query}': {e}")

    logger.info(f"Total unique Google News articles: {len(all_articles)}")
    return all_articles


def _clean_html(text: str) -> str:
    """Remove HTML tags from summary text."""
    import re
    clean = re.sub(r"<[^>]+>", "", text)
    return clean.strip()
