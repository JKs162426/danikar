# Detalles DanKar

Online catalog for **Detalles DanKar**, a handmade hair-accessories shop in
Pariaguán, Venezuela. Customers browse the catalog, build an order and send it
straight to WhatsApp; the owner manages products, categories and photos from a
private admin panel.

Built for a **real client** and running in production.

**Live:** <https://dankar.vercel.app>

[![Detalles DanKar — store home page](docs/screenshot.jpg)](https://dankar.vercel.app)

## Features

- **Public catalog** with category filters
- **Order cart** — several products in a single WhatsApp message (saved in the browser)
- **Admin panel** protected with JWT in an httpOnly cookie
- **Category management** — create, rename, reorder and delete (moving their products)
- **AI product descriptions from the photos** — one click in the admin panel and a vision model looks at the product photo and writes a warm, on-brand description (see below)
- **Prices in bolívares** — the owner sets the daily exchange rate; the store, cart and WhatsApp message show both currencies
- **Image uploads** to Cloudinary, validated by the file's real content, not just its name or MIME type
- **Persistent content** in MongoDB, validated with Zod

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React, React Router |
| Backend | Node.js, Express, Zod |
| Auth | JWT + bcrypt, httpOnly cookie |
| Data & media | MongoDB, Cloudinary |
| AI | Qwen 3.8 27B (vision) on Groq, OpenAI-compatible API |
| Deploy | Vercel (frontend) + Render (API) |

## How it fits together

- Vercel rewrites `/api/*` to the Render API, so the browser only ever talks to
  one origin and the session cookie stays first-party.
- Security headers (including a strict Content-Security-Policy) are set in
  `vercel.json`.
- Admin login attempts and image uploads are rate-limited per client IP, taken
  from Cloudflare's `CF-Connecting-IP` (the only forwarded IP a client can't
  forge here), plus a global cap (`server/middleware/limitador.js`, `ip.js`).

## AI descriptions from the product photo

Writing product copy is the slowest part of adding a product for a small
business owner. In the admin panel, **✨ Escribir con IA** sends the product's
main photo plus its name, category, colors, sizes and clip type to
**Qwen 3.8 27B**, a vision model served by Groq, and fills in the description.
The owner reviews it, can ask for another version, or undo it.

Example, written from a real catalog photo: *"Este Mega Lazo de pinza luce un
diseño impactante en tonos azul marino y gris, adornado con cuentas doradas en
las puntas y una figura central de superhéroe…"* — the gold beads and the
superhero only exist in the photo.

- **Grounded, not invented:** the prompt only allows facts from the product
  data and the photo, in a warm Venezuelan Spanish tone, 2–3 sentences, no
  prices (they change) and no emojis. Code: `server/ia/descripcion.js`.
- **Keeps what the owner wrote:** the existing description (often the
  measurements) is sent as owner notes that must be kept verbatim.
- **Sized for the free tier:** each photo costs ~1,800 tokens at any size, so
  one 768 px photo is sent by default (`IA_MAX_FOTOS`); smaller images cost the
  same and were recognized worse. If the model can't read the photo, it retries
  with text only.
- **Safe by design:** the API key never reaches the browser; the endpoint is
  admin-only, rate-limited (20 requests / 10 min) and only forwards Cloudinary
  image URLs.
- **Swappable model:** Groq speaks the OpenAI chat-completions format, so any
  other model or provider is a matter of `IA_MODELO` and `IA_URL`.

## Getting started

Requires Node.js, a MongoDB database and a Cloudinary account.

```bash
npm install
cp .env.example .env               # fill in MongoDB, JWT and Cloudinary values
node server/scripts/hash-password.js   # generates ADMIN_PASSWORD_HASH
npm run server                     # API on http://localhost:4000
npm start                          # React app on http://localhost:3000 (proxies /api)
```

See `.env.example` for every environment variable.

## Tests

```bash
CI=true npm test       # frontend (Jest + React Testing Library)
npm run test:server    # backend (node:test)
```

## Health check

`GET /api/salud` returns `{ "ok": true, "baseDatos": "ok" }`. Render uses it as the
`healthCheckPath` (see `render.yaml`). It stays `200` even if MongoDB stops
responding (`"baseDatos": "sin respuesta"`), because the catalog is served from
memory and the store keeps working; it only returns `503` if the catalog was
never loaded.

## Author

Built by [Jesus Figueroa](https://jfigueroa.dev) · [GitHub](https://github.com/JKs162426)
