# GitBridge Admin Portal — Phase 1

Standalone React/Vite admin frontend, designed to use the existing FastAPI backend.

## Run
1. Keep your existing backend running at `http://localhost:8000`.
2. Open a terminal in `admin-frontend`.
3. Run `npm install` then `npm run dev`.
4. Open `http://localhost:5174`.

Optional API URL: create `.env` in `admin-frontend` with `VITE_API_URL=http://localhost:8000`.

## Current features
- Separate admin UI and login screen (no public admin registration).
- Dashboard statistics from `GET /api/admin/dashboard`.
- Recruiter listing and approval/rejection via existing admin endpoints.
- Sync logs via `GET /api/admin/sync-logs`.
- Opportunities and Applications are clearly marked as pending backend API work; no fake data.

## Important integration note
Login currently expects `POST /api/auth/login` with `{ "email": "...", "password": "..." }` and a response containing `access_token` or `token`. Confirm the exact response shape in your backend. Backend must enforce admin role for every `/api/admin/*` endpoint. Create/provision the first admin securely through a trusted database/admin operation; do not add public admin signup.
