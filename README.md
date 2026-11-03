# VaaniShop AI

Shop websites made by voice. A shopkeeper taps the mic and talks about their shop in
Hindi, Marathi, Tamil, English or any mix. VaaniShop turns that into a website with a
price list, WhatsApp ordering, opening hours, directions and a QR poster for the counter.

## What it does

- **Speak or type, no account needed to try.** The page is built and shown as a preview
  first; signing up (mobile number + password) happens only when publishing.
- **The AI fills gaps honestly.** It keeps every stated fact (prices, numbers, address),
  never invents contact details, and marks any items it adds as *suggested* so the owner
  can keep or delete them.
- **WhatsApp basket.** Customers tap Add on items, then Order; WhatsApp opens with the full
  list and an estimated total, addressed to the shop.
- **Change by voice.** "Samosa ka price 25 kar do, jalebi add karo" edits just those items
  and leaves the rest of the shop alone.
- **Photos from the phone.** Resized in the browser before upload; stored in Postgres.
- **Share kit.** Friendly link (`/s/ganesh-sweets`), WhatsApp share, QR PNG download and a
  printable A4 counter poster.
- **"Open now" status** read from the timings text.

## Stack

- **Backend:** Spring Boot 3.3, PostgreSQL (JSONB + Flyway), Groq for speech-to-text
  (Whisper) and page writing (`openai/gpt-oss-120b` by default)
- **Frontend:** React 18, Vite, Tailwind, lucide-react, qrcode.react

## Prerequisites

- Java 17+, Maven 3.9+
- PostgreSQL 14+
- Node 18+
- A Groq API key

## 1) Configure env vars

Copy `.env.example` to `.env` and set at least:

- `GROQ_API_KEY`
- `JWT_SECRET` (a long random value outside local experiments)

Useful optional settings:

| Variable | Default | Notes |
| --- | --- | --- |
| `GROQ_CHAT_MODEL` | `openai/gpt-oss-120b` | Any Groq chat model that supports JSON mode |
| `GROQ_REASONING_EFFORT` | `low` | Only for reasoning models such as gpt-oss; leave empty for others |
| `RATE_LIMIT_AI_PER_MINUTE` | `8` | Page builds and voice edits, per IP or per account |
| `RATE_LIMIT_SPEECH_PER_MINUTE` | `10` | Transcriptions per IP |
| `FORWARD_HEADERS_STRATEGY` | `none` | Set to `native` behind a trusted reverse proxy so limits see real client IPs |

The backend reads environment variables from the shell:

```bash
set -a; source .env; set +a
```

The frontend reads `VITE_BACKEND_URL` from `frontend/.env` (defaults to `http://localhost:8080`):

```bash
cp frontend/.env.example frontend/.env
```

## 2) Start PostgreSQL

```sql
CREATE DATABASE vaanishopai;
```

Flyway creates the tables on first start.

## 3) Run the backend

```bash
cd backend
mvn spring-boot:run
```

Runs on `http://localhost:8080`. Tests: `mvn test`.

## 4) Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## API overview

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/speech/transcribe` | public, rate limited | Audio (webm/mp4/ogg) to text |
| POST | `/api/shop/generate` | public, rate limited | Description to shop preview; nothing saved |
| POST | `/api/shop` | owner | Publish a previewed shop |
| POST | `/api/shop/create` | owner | Description to saved shop in one step |
| POST | `/api/shop/update` | owner | Apply a spoken/typed change; returns `changeSummary` |
| PUT | `/api/shop/{id}/fields` | owner | Save edits from the editor |
| POST | `/api/shop/{id}/images` | owner | Upload a JPEG/PNG/WebP photo (max 3 MB) |
| GET | `/api/images/{id}` | public | Serve a photo |
| GET | `/api/shop/my` | owner | List your shops |
| GET | `/api/shop/manage/{id}` | owner | Load a shop for editing |
| GET | `/api/shop/s/{slug}`, `/api/shop/{id}` | public | Public shop page data (counts a visit) |
| DELETE | `/api/shop/{id}` | owner | Delete a shop and its photos |

## Git hygiene

- Keep real `.env` files local only.
- Generated folders such as `backend/target`, `frontend/dist` and `node_modules` are ignored.
