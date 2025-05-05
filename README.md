# API Update Monitor

This service polls a JSON API on a fixed interval, logs only when the payload changes, and records the interval since the last change.

## Configuration

- **POLL_INTERVAL** (seconds, default `600` = 10 min)

## Deploying on Render

1. Push this repo to GitHub/GitLab.
2. In Render.com, click **New → Web Service**.
3. Connect your repo, branch = `main` (or your choice).
4. Build Command: `npm install`
5. Start Command: `npm start`
6. In **Environment** set `POLL_INTERVAL` (optional).
7. Deploy.

Once live, your service URL (`https://<your-name>.onrender.com/`) will **serve** `index.txt` showing one line per update: