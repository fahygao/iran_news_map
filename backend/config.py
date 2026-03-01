import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_PATH = os.getenv("DATABASE_PATH", "./database.db")
GMAIL_CREDENTIALS_PATH = os.getenv("GMAIL_CREDENTIALS_PATH", "./credentials.json")
GMAIL_TOKEN_PATH = os.getenv("GMAIL_TOKEN_PATH", "./token.json")
ALERT_RECIPIENT = os.getenv("ALERT_RECIPIENT", "")  # comma-separated for multiple: "a@gmail.com,b@gmail.com"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
FLASK_ENV = os.getenv("FLASK_ENV", "production")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

GOOGLE_NEWS_QUERIES = [
    "iran war",
    "iran conflict",
    "tehran attack",
    "US troops iran",
    "iran bombing",
    "iran military",
    "iran airstrike",
]

GDELT_GEO_ENDPOINT = "https://api.gdeltproject.org/api/v2/geo/geo"
GDELT_DOC_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc"

SEVERITY_LEVELS = ["critical", "high", "medium", "low"]
CATEGORIES = ["conflict", "military", "diplomatic", "political", "humanitarian"]

OPENSKY_USERNAME = os.getenv("OPENSKY_USERNAME", "")
OPENSKY_PASSWORD = os.getenv("OPENSKY_PASSWORD", "")
OPENSKY_BBOX = {"lamin": 20, "lomin": 30, "lamax": 42, "lomax": 65}

DATA_RETENTION_DAYS = 90
CACHE_MAX_AGE = 300  # 5 minutes
