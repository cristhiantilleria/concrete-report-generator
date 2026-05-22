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
injects the `x-api-key` header from `VITE_ANTHROPIC_API_KEY`. The key never
reaches the browser bundle. If the key is missing or the API errors out, the app
falls back to its built-in template so reports always generate.

## Build

```bash
npm run build
```

Note: the proxy only runs in `vite dev` / `vite preview`. For a deployed static
build, host the Claude call behind your own serverless function.

## Structure

```
src/
  main.jsx                  React entry
  App.jsx                   State + orchestration
  styles.css                All UI + HRF report styles
  logo.js                   Embedded HRF logo (base64)
  lib/
    api.js                  Claude API call + fallback report generator
    imageUtils.js           Photo compression
    docxGenerator.js        Full .docx generation (docx-js)
  components/
    FormPanel.jsx           Multi-step input form
    HrfReport.jsx           HRF-formatted preview pages
```
