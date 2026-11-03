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
- **Rich link previews.** Shared shop links show the shop's own card (awning, name, tagline)
  in WhatsApp and social apps, and carry search-engine business data and a sitemap.
- **Installable.** Shopkeepers can add VaaniShop to their phone's home screen.

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
| `APP_PUBLIC_URL` | from request | Public address used in link previews and the sitemap |
| `FORWARD_HEADERS_STRATEGY` | `none` | Set to `native` behind a trusted reverse proxy so limits see real client IPs |

The backend reads environment variables from the shell:

```bash
set -a; source .env; set +a
```

The frontend calls the API with relative `/api` URLs. In development Vite proxies them to
`http://localhost:8080` (override with `VITE_DEV_API`); in production the backend serves the
app itself, so no frontend configuration is needed.

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

API on `http://localhost:8080`. Tests: `mvn test`.

## 4) Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5847` (fixed with `strictPort`, so it never takes another
project's port). Tests: `npm test`.

## Deploy

The production build is a single server: Spring Boot serves the API and the built app on
port 8080.

**Docker Compose (app + Postgres):** set `GROQ_API_KEY`, `JWT_SECRET` (`openssl rand -base64 48`),
`POSTGRES_PASSWORD` and `APP_PUBLIC_URL` in `.env`, then:

```bash
docker compose up -d --build
```

**Docker image only** (bring your own Postgres): `docker build -t vaanishop .` and run it with
the `DATABASE_*`, `GROQ_API_KEY`, `JWT_SECRET` and `APP_PUBLIC_URL` variables.

**Plain Java server:** `./scripts/package.sh` builds `backend/target/vaanishopai-backend-*.jar`
with the app inside; run it with `java -jar`.

Behind nginx, a load balancer or a platform proxy, set `FORWARD_HEADERS_STRATEGY=native` so
rate limits and generated links use the real client address and `https` scheme. Always set
`APP_PUBLIC_URL` (e.g. `https://vaanishop.in`) so link previews and the sitemap use your domain.

CI (`.github/workflows/ci.yml`) runs the backend and frontend tests and builds the Docker
image on every push to `main` and every pull request.

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
| GET | `/s/{slug}` | public | Shop page HTML with link-preview tags |
| GET | `/og/{slug}.png` | public | 1200×630 link-preview card |
| GET | `/sitemap.xml`, `/robots.txt` | public | Search engine discovery |

## Git hygiene

- Keep real `.env` files local only.
- Generated folders such as `backend/target`, `frontend/dist` and `node_modules` are ignored.
