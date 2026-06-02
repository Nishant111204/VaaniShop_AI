# VaaniShop AI (MVP)

Voice-driven website generator.

## What’s included
- **Backend**: Spring Boot + PostgreSQL (JSONB) + Groq Whisper Speech-to-Text + Groq Llama extraction
- **Frontend**: React + Tailwind + MediaRecorder voice UI + public shop page

## Prereqs
- Java 17+
- Maven 3.9+
- PostgreSQL 14+
- Node 18+

## 1) Configure env vars
Copy `.env.example` to `.env` for local development, then replace placeholder values.

Minimum required:
- `GROQ_API_KEY`
- `JWT_SECRET` (use a long random value outside local experiments)

The backend reads environment variables from the shell. One local option:

```bash
set -a
source .env
set +a
```

The frontend reads Vite env files from the `frontend` directory. Copy the example:

```bash
cp frontend/.env.example frontend/.env
```

## 2) Start PostgreSQL
Create the database:

```sql
CREATE DATABASE vaanishopai;
```

## 3) Run backend

```bash
cd backend
mvn spring-boot:run
```

Backend: `http://localhost:8080`

## 4) Run frontend
Run:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## End-to-end flow
1. Open the frontend home page.
2. Click **Start Voice Input**, record, then stop.
3. The app transcribes audio → creates a shop → redirects to `/shop/:id`.
4. Use **Dashboard** to update the shop via voice.

## Git hygiene
- Keep real `.env` files local only.
- Commit `.env.example` and `frontend/.env.example` so collaborators know which variables are required.
- Generated folders such as `backend/target`, `frontend/dist`, and `node_modules` are intentionally ignored.
