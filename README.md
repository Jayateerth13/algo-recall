## LeetCode Algorithm Flashcard App

Practice LeetCode-style problems with spaced repetition. Each user has their own problem set and review history.

### Stack
- Backend: FastAPI (in `backend/`)
- Frontend: React + Vite + Tailwind (in `frontend/`)
- Database: PostgreSQL (Supabase) with per-user scoping
- Auth: Supabase Auth (email/password + optional Google)

### Run locally
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new shell)
cd frontend
npm install
npm run dev
```

### Notes
- For local dev, run backend and frontend as above.
- Production deploys typically use a managed Postgres and serverless hosting.
