# Servers Needed to Run the App

## Overview

| # | What | Where it runs | How to start |
|---|------|--------------|--------------|
| 1 | **PostgreSQL database** | `localhost:5432` | Docker |
| 2 | **Backend API** (NestJS) | `localhost:3001` | Terminal 1 |
| 3 | **Frontend** (Next.js) | `localhost:3000` | Terminal 2 |

**Supabase** is a cloud service — no local server needed, just the keys in your `.env` file.

---

## Step-by-step instructions

### Pre-requisite: Make sure Docker is running
Open the **Docker Desktop** app on your Mac before anything else.

---

### Step 1 — Start the database (run once, keep it running)

```bash
cd /Users/amit/Desktop/Apps/massage
docker-compose up -d
```

The `-d` runs it in the background. You only need to do this once per machine restart.

Verify it started:
```bash
docker ps
```
You should see `wellness-crm-postgres` in the list.

---

### Step 2 — Install dependencies (first time only)

```bash
cd /Users/amit/Desktop/Apps/massage
npm install
```

---

### Step 3 — Start the backend API

Open a **new terminal tab/window**:
```bash
cd /Users/amit/Desktop/Apps/massage/services/api
npm run dev
```

Leave this terminal open. You should see `Application is running on: http://localhost:3001`.

---

### Step 4 — Start the frontend

Open another **new terminal tab/window**:
```bash
cd /Users/amit/Desktop/Apps/massage/apps/web
npm run dev
```

Leave this open too. You should see `ready started server on http://localhost:3000`.

---

### Step 5 — Open the app

Go to **http://localhost:3000** in your browser.

---

## Keep open at all times

You need **3 things running** while developing:

- Docker Desktop (runs PostgreSQL in the background)
- Terminal running `services/api` (backend)
- Terminal running `apps/web` (frontend)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `localhost:3000` not loading | Make sure Step 4 terminal is still running |
| API errors in the browser | Make sure Step 3 terminal is still running |
| Database connection errors | Run `docker ps` — restart with `docker-compose up -d` if postgres isn't listed |
| Port already in use | Another process is using the port. Run `lsof -i :3000` (or `:3001`, `:5432`) to find and kill it |
