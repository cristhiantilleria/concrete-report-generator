# Concrete Report Generator

Vite + React migration of the HRF Services Corp inspection report generator. Same
functionality and report format as the original single-file HTML app — multi-step
form, photo upload + compression, AI-composed report sections (with template
fallback), live HRF-formatted preview, and one-click `.docx` export.

## Setup

```bash
npm install
cp .env.example .env.local   # add your Anthropic API key
npm run dev
```

The Vite dev server proxies `/api/anthropic` → `https://api.anthropic.com` and
injects the `x-api-key` header from `ANTHROPIC_API_KEY` (the legacy
`VITE_ANTHROPIC_API_KEY` name is still accepted as a fallback). The key never
reaches the browser bundle. If the key is missing or the API errors out, the app
falls back to its built-in template so reports always generate.

## Build

```bash
npm run build
```

## Deploy on Vercel

The repo is preconfigured for Vercel. The dev-only Vite proxy is mirrored in
production by a serverless function at [`api/anthropic/v1/messages.js`](api/anthropic/v1/messages.js),
which forwards requests to Anthropic with the API key injected server-side.
Client code (`src/lib/api.js`) calls the same `/api/anthropic/v1/messages` URL
in both environments — no build-time switch is needed.

**One-time setup:**

1. In the Vercel dashboard → **Add New Project** → import this GitHub repo.
   Vercel auto-detects Vite and the `api/` folder; no build/config overrides
   needed.
2. Project **Settings → Environment Variables**, add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your `sk-ant-…` key
   - Scopes: **Production, Preview, Development** (check all three)
3. Trigger the first deploy. Subsequent pushes to `main` auto-deploy.

**Local parity:** put the same `ANTHROPIC_API_KEY=…` line in `.env.local`. To
test the Vercel function locally (instead of the Vite proxy) run `vercel dev`
after `npm i -g vercel`.

## Structure

```
api/
  anthropic/v1/messages.js  Vercel serverless proxy → Anthropic
src/
  main.jsx                  React entry
  App.jsx                   State + orchestration
  styles.css                All UI + HRF report styles
  logo.js                   HRF logo loader (file in /public)
  lib/
    api.js                  Claude API call + fallback report generator
    imageUtils.js           Photo compression
    docxGenerator.js        Full .docx generation (docx-js)
  components/
    FormPanel.jsx           Multi-step input form
    HrfReport.jsx           HRF-formatted preview pages
```
