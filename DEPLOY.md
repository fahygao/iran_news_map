# Deploy Guide: Iran News Map

## How It Works in Production

```
                  ┌──────────────────────────────────────┐
                  │        PythonAnywhere (Backend)       │
                  │                                      │
  User's Phone    │  Flask API ← WSGI (always running)   │
  ◄──Telegram───  │  fetch_news.py ← Scheduled Task      │
                  │  SQLite database                      │
                  └──────────────┬───────────────────────┘
                                 │ API calls
                  ┌──────────────┴───────────────────────┐
                  │         Vercel (Frontend)             │
                  │  Next.js static + client-side fetch   │
                  └──────────────────────────────────────┘
```

**Key difference from local dev:**
- Locally you run 3 terminals (app.py + scheduler.py + npm run dev)
- In production: PythonAnywhere runs Flask automatically via WSGI, and runs fetch_news.py on a schedule. Vercel hosts the frontend. No terminals needed.

---

## Step 1: Push Code to GitHub

```bash
cd ~/Desktop/Personal_Growth/iran_news_map

# Make sure .gitignore excludes sensitive files
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.pyc
backend/venv/
backend/database.db
backend/database.db-shm
backend/database.db-wal
backend/.env
backend/token.json
backend/credentials.json

# Node
frontend/node_modules/
frontend/.next/
frontend/.env.local

# IDE
.DS_Store
.vscode/
.idea/
EOF

git add -A
git commit -m "Prepare for deployment"
git push origin main
```

---

## Step 2: Backend → PythonAnywhere

### 2.1 Create Account
1. Go to **https://www.pythonanywhere.com** → Sign up
2. Username will become your URL: `https://YOURUSERNAME.pythonanywhere.com`

### 2.2 Clone Repo (in PythonAnywhere Bash Console)
Click **"Consoles"** → **"Bash"** → run:

```bash
git clone https://github.com/YOUR_GITHUB_USER/iran_news_map.git
cd iran_news_map/backend
```

### 2.3 Create Virtual Environment

```bash
mkvirtualenv --python=/usr/bin/python3.10 iran-news
pip install -r requirements.txt
```

### 2.4 Configure Environment Variables

```bash
cat > /home/YOURUSERNAME/iran_news_map/backend/.env << 'EOF'
FLASK_ENV=production
DATABASE_PATH=/home/YOURUSERNAME/iran_news_map/backend/database.db
GMAIL_CREDENTIALS_PATH=/home/YOURUSERNAME/iran_news_map/backend/credentials.json
GMAIL_TOKEN_PATH=/home/YOURUSERNAME/iran_news_map/backend/token.json
ALERT_RECIPIENT=your_email@example.com
FRONTEND_URL=https://your-app.vercel.app
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
EOF
```

> **IMPORTANT**: Replace `YOURUSERNAME` with your PythonAnywhere username everywhere.

### 2.5 Initialize Database & First Fetch

```bash
cd /home/YOURUSERNAME/iran_news_map/backend
python -c "from models import init_db; init_db()"
python tasks/fetch_news.py
```

You should see "Total new events stored: XXX" and get a Telegram alert.

### 2.6 Set Up Web App (Flask API)

1. Go to **Web** tab → click **"Add a new web app"**
2. Click **Next** → choose **"Manual configuration"** → choose **"Python 3.10"**
3. On the Web App config page, set:

| Setting | Value |
|---------|-------|
| **Source code** | `/home/YOURUSERNAME/iran_news_map/backend` |
| **Working directory** | `/home/YOURUSERNAME/iran_news_map/backend` |
| **Virtualenv** | `/home/YOURUSERNAME/.virtualenvs/iran-news` |

4. Click on the **WSGI configuration file** link (it looks like `/var/www/YOURUSERNAME_pythonanywhere_com_wsgi.py`)
5. **Delete everything** in that file and replace with:

```python
import sys
import os

project_path = '/home/YOURUSERNAME/iran_news_map/backend'
sys.path.insert(0, project_path)
os.chdir(project_path)

from dotenv import load_dotenv
load_dotenv(os.path.join(project_path, '.env'))

from app import app as application
```

6. Click **Save** → go back to Web tab → click **"Reload"**

### 2.7 Test the API

Open in your browser:
```
https://YOURUSERNAME.pythonanywhere.com/api/status
```

You should see JSON like:
```json
{"status": "healthy", "total_events": 488, ...}
```

### 2.8 Set Up Auto-Fetch (Scheduled Task)

1. Go to **Tasks** tab
2. Under "Scheduled tasks", add:

| Field | Value |
|-------|-------|
| **Time** | Pick any time (e.g., 12:00 UTC) |
| **Command** | `/home/YOURUSERNAME/.virtualenvs/iran-news/bin/python /home/YOURUSERNAME/iran_news_map/backend/tasks/fetch_news.py` |

> **Free tier**: 1 daily task. For more frequent updates, use **cron-job.org** (free):
> 1. Go to https://cron-job.org → create account
> 2. Create a job:
>    - **URL**: `https://YOURUSERNAME.pythonanywhere.com/api/fetch`
>    - **Method**: POST
>    - **Schedule**: Every 30 minutes
> 3. This hits your `/api/fetch` endpoint which triggers the full fetch pipeline

---

## Step 3: Frontend → Vercel

### 3.1 Deploy

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New Project"** → Import `iran_news_map`
3. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Framework** | Next.js (auto-detected) |

4. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOURUSERNAME.pythonanywhere.com/api` |

5. Click **Deploy**

### 3.2 Note Your Vercel URL
After deployment, Vercel gives you a URL like `https://iran-news-map.vercel.app`.

### 3.3 Update Backend CORS
Go back to PythonAnywhere Bash console:

```bash
cd /home/YOURUSERNAME/iran_news_map/backend
nano app.py
```

Find this line:
```python
CORS(app, origins="*")
```

Change to:
```python
CORS(app, origins=["https://iran-news-map.vercel.app", "http://localhost:3000"])
```

(Use your actual Vercel URL)

Then go to **Web** tab → click **Reload**.

### 3.4 Update .env FRONTEND_URL
Also update the `.env` so Telegram alert links point to your live site:

```bash
# In .env, change:
FRONTEND_URL=https://iran-news-map.vercel.app
```

---

## Step 4: Verify Everything Works

| Check | How |
|-------|-----|
| API is live | Visit `https://YOURUSERNAME.pythonanywhere.com/api/status` |
| Frontend loads | Visit your Vercel URL |
| Map shows events | Should see markers on Iran |
| Telegram works | Wait for next scheduled fetch, or POST to `/api/fetch` |
| Auto-refresh | Map and news feed update every 2 min automatically |

---

## Updating the Code

When you make changes locally:

```bash
# Local
git add -A
git commit -m "Your changes"
git push origin main
```

Then:
- **Vercel**: Auto-deploys on push (no action needed)
- **PythonAnywhere**: SSH in and pull:
  ```bash
  cd /home/YOURUSERNAME/iran_news_map
  git pull
  ```
  Then go to **Web** tab → click **Reload**

---

## Local Development (3 Terminals)

```bash
# Terminal 1: Backend API
cd backend && source venv/bin/activate && python app.py

# Terminal 2: Auto-fetch scheduler
cd backend && source venv/bin/activate && python scheduler.py

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## Cost

| Service | Free Tier | Paid |
|---------|-----------|------|
| PythonAnywhere | 1 web app, 1 daily task, 512MB | $5/mo: hourly tasks, more storage |
| Vercel | Unlimited deploys, 100GB bandwidth | $20/mo: more bandwidth |
| cron-job.org | Unlimited cron jobs | Free |
| Telegram Bot | Free | Free |

**Total cost to run: $0** (with cron-job.org for 30-min fetching)
