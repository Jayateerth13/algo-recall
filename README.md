## LeetCode Algorithm Flashcard App

This repository contains a full‑stack app for practicing LeetCode‑style algorithm problems using a spaced‑repetition flashcard system.

- **Backend**: FastAPI + SQLite (in `backend/`)
- **Frontend**: React + Vite + Tailwind CSS (in `frontend/`)

### Getting Started

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

The high‑level feature and design specification lives in `leetcode_flashcard_readme.md`.


