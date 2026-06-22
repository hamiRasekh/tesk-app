# Aveno

A mobile-first PWA starter built with Next.js and React, with a FastAPI backend.

## Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The frontend expects `NEXT_PUBLIC_API_URL=http://localhost:8000`.
