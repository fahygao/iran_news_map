# Iran News Map

Real-time conflict intelligence dashboard tracking US-Iran tensions. Aggregates news from multiple sources, classifies events by severity and type, plots them on an interactive map with emoji markers, conflict zone overlays, and attack route lines.

![Map Preview](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Live Map** — Interactive dark-themed map centered on Iran with emoji markers (rocket, explosion, fire, news)
- **Conflict Zones** — Toggle overlays for Strait of Hormuz, Iran-Iraq border, Persian Gulf, Kurdish regions
- **Attack Routes** — Dashed lines showing strike origins for missile/airstrike events
- **Severity Classification** — Critical / High / Medium / Low based on keyword and NLP analysis
- **Category Filters** — Conflict, Military, Diplomatic, Political, Humanitarian
- **Timeline View** — Chronological event feed with "LIVE" indicator for today's events
- **Auto-Refresh** — Map and news feed update every 2 minutes
- **Telegram Alerts** — Push notifications for critical/high severity events
- **Email Alerts** — Gmail API digest emails for high-priority events
- **Auto-Fetch Scheduler** — Fetches new articles every 30 minutes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, react-leaflet |
| Backend | Python 3.10+, Flask, SQLite |
| Data Sources | Google News RSS, GDELT GEO API |
| Notifications | Telegram Bot API, Gmail API |
| Hosting | Vercel (frontend), PythonAnywhere (backend) |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials (see Configuration below)
python -c "from models import init_db; init_db()"
python tasks/fetch_news.py   # Initial data fetch
python app.py                # Start API server on port 5001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local if backend is on a different port
npm run dev                  # Start on port 3000
```

### Auto-Fetch Scheduler (optional)

```bash
cd backend
source venv/bin/activate
python scheduler.py          # Fetches every 30 minutes
```

Open http://localhost:3000 to view the dashboard.

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```env
FLASK_ENV=development
DATABASE_PATH=./database.db
ALERT_RECIPIENT=your_email@example.com
FRONTEND_URL=http://localhost:3000

# Gmail API (optional - for email alerts)
GMAIL_CREDENTIALS_PATH=./credentials.json
GMAIL_TOKEN_PATH=./token.json

# Telegram Bot (optional - for push notifications)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Telegram Bot Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot`
2. Copy the bot token
3. Start a chat with your bot, then get your chat ID from:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`

### Gmail API Setup (optional)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Gmail API
3. Create OAuth 2.0 credentials → download as `credentials.json`
4. Run `python generate_token.py` to authorize

## Project Structure

```
backend/
├── app.py                 # Flask API server
├── config.py              # Environment configuration
├── models.py              # SQLite models and queries
├── scheduler.py           # APScheduler auto-fetch
├── wsgi.py                # WSGI entry point (production)
├── tasks/
│   └── fetch_news.py      # Fetch pipeline
├── fetchers/
│   ├── classifier.py      # Event classification + geocoding
│   ├── google_news.py     # Google News RSS fetcher
│   └── gdelt.py           # GDELT GEO API fetcher
└── alerts/
    ├── email_sender.py    # Gmail alerts
    └── telegram_sender.py # Telegram alerts

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx     # Root layout + nav
│   │   ├── page.tsx       # Map + news list page
│   │   ├── globals.css    # Styles
│   │   └── timeline/
│   │       └── page.tsx   # Timeline page
│   ├── components/
│   │   ├── Map.tsx        # Leaflet map with markers
│   │   ├── Timeline.tsx   # Timeline view
│   │   ├── NewsList.tsx   # News feed
│   │   ├── Filters.tsx    # Category/severity filters
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts         # API client
│   │   └── conflictZones.ts
│   └── types/
│       └── events.ts      # TypeScript interfaces
└── vercel.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | System health and source status |
| GET | `/api/events` | Paginated event list with filters |
| GET | `/api/events/geo` | GeoJSON for map markers |
| GET | `/api/events/timeline` | Events grouped by date |
| POST | `/api/fetch` | Manually trigger news fetch |

## Deployment

See [DEPLOY.md](DEPLOY.md) for step-by-step instructions to deploy:
- Backend → PythonAnywhere (free tier)
- Frontend → Vercel (free tier)
- Auto-fetch → cron-job.org (free)

## License

MIT
