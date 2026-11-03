# VaaniShop AI (Backend)

## Prereqs
- Java 17+
- Maven 3.9+
- PostgreSQL 14+

## Local setup
1. Create database:

```sql
CREATE DATABASE vaanishopai;
```

2. Export env vars from the project root `.env` file:

```bash
set -a
source ../.env
set +a
```

Relevant variables:
- `GROQ_API_KEY`
- `GROQ_CHAT_MODEL` (default `llama-3.1-8b-instant`)
- `GROQ_STT_MODEL` (default `whisper-large-v3`)
- `GROQ_STT_LANGUAGE` (default `en`)
- `DATABASE_URL` (default `jdbc:postgresql://localhost:5432/vaanishopai`)
- `DATABASE_USERNAME` (default `postgres`)
- `DATABASE_PASSWORD` (default `postgres`)
- `CORS_ALLOWED_ORIGINS` (default `http://localhost:5847`, the frontend dev server)
- `JWT_SECRET`
- `JWT_EXPIRATION_MS` (default `604800000`)
- `RATE_LIMIT_SPEECH_PER_MINUTE` (default `10`)

3. Run:

```bash
cd backend
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`.

## API
- `POST /api/speech/transcribe` (multipart form-data: `audio` = webm)
- `POST /api/shop/create` body: `{ "text": "..." }`
- `POST /api/shop/update` body: `{ "shopId": "...", "text": "..." }`
- `GET /api/shop/{id}`
