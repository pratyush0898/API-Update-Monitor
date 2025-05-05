import express from 'express'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const API_URL       = 'https://devto-api-x7rl.onrender.com/api/articles'
const LOG_FILE      = path.resolve('index.txt')
const DATA_FILE     = path.resolve('lastResponse.json')
const CHANGE_FILE   = path.resolve('lastChange.txt')
// env var POLL_INTERVAL in seconds, default to 600 (10 min)
const POLL_INTERVAL = (process.env.POLL_INTERVAL
                        ? Number(process.env.POLL_INTERVAL)
                        : 600) * 1000

// ensure files exist
for (const f of [LOG_FILE, DATA_FILE, CHANGE_FILE]) {
  if (!fs.existsSync(f)) fs.writeFileSync(f, '')
}

// load previous state
let lastData = null
try { lastData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || 'null') }
catch { lastData = null }

let lastChangeTime = null
try {
  const ts = fs.readFileSync(CHANGE_FILE, 'utf8').trim()
  lastChangeTime = ts ? new Date(ts) : null
} catch {
  lastChangeTime = null
}

async function pollLoop() {
  while (true) {
    try {
      const now = new Date()
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      // first ever fetch
      if (!lastData) {
        lastData       = json
        lastChangeTime = now
        fs.writeFileSync(DATA_FILE, JSON.stringify(json, null,2))
        fs.writeFileSync(CHANGE_FILE, now.toISOString())
        fs.appendFileSync(LOG_FILE,
          `${now.toISOString()} | interval: 0h0m (initial)\n`
        )

      // compare on subsequent fetches
      } else if (JSON.stringify(json) !== JSON.stringify(lastData)) {
        const diffMs = now - lastChangeTime
        const hours  = Math.floor(diffMs / 3_600_000)
        const mins   = Math.floor((diffMs % 3_600_000) / 60_000)

        fs.appendFileSync(LOG_FILE,
          `${now.toISOString()} | interval: ${hours}h${mins}m\n`
        )

        lastData       = json
        lastChangeTime = now
        fs.writeFileSync(DATA_FILE,   JSON.stringify(json, null,2))
        fs.writeFileSync(CHANGE_FILE, now.toISOString())
      }

    } catch (err) {
      fs.appendFileSync(LOG_FILE,
        `${new Date().toISOString()} | ERROR: ${err.message}\n`
      )
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL))
  }
}

pollLoop()

// Express server to serve index.txt
const app = express()
app.get('/', (_req, res) => {
  res.type('text/plain')
  fs.createReadStream(LOG_FILE).pipe(res)
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Listening on port ${port}, serving index.txt`)
})