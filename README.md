<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NapNox AI Prompt Generator

A React + Vite app that turns a short idea plus a few filters into detailed,
platform-specific AI prompts across 14 categories, using Gemini 2.5 Flash.

View your app in AI Studio: https://ai.studio/apps/drive/1HW2LuKOTCgYlPLNvMnHZiPt4Wz7a5adM

## Run locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` to your own key
   ([get one here](https://aistudio.google.com/apikey)).
3. Run the app:
   `npm run dev`

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## How the API key is handled

**The Gemini API key is never sent to the browser.** The browser posts the
user's form selections to `/api/generate`; that handler reads
`GEMINI_API_KEY` from the server environment, calls Gemini, and returns only
the generated prompts.

- `api/generate.ts` — the server handler. A standard Web Fetch handler
  (`Request` in, `Response` out), so it deploys unchanged as a serverless
  function on Vercel, Netlify, Cloudflare Workers or Deno Deploy.
- `vite.config.ts` — mounts that same handler on the dev server, so local
  development matches production. The key is loaded into the dev server
  process only; it is deliberately **not** passed to Vite's `define`, which
  would inline it into the client bundle.
- `services/geminiService.ts` — client side; just a `fetch` to `/api/generate`.

To confirm the key never ships to users, run `npm run build` and search the
output: `grep -r "AIzaSy" dist/` should return nothing.

### Deploying

Set `GEMINI_API_KEY` as a secret/environment variable in your hosting
provider's dashboard — not in a committed file. On Vercel the `api/` directory
is picked up automatically; on Netlify point `functions` at it or move the
handler to `netlify/functions/`.

### Guardrails on the endpoint

Because `/api/generate` is public, it validates every request against the
category definitions in `constants.ts` before spending a token. Unknown
categories, subtypes, platforms or filter values are rejected, free text is
length-capped, and uploads must be a JPG/PNG/WebP under 4MB. This stops the
endpoint from being used as a general-purpose proxy to your Gemini quota.

Upstream failures are logged in full on the server, but the client only
receives a generic, user-safe message.
