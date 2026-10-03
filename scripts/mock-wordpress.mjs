#!/usr/bin/env node
/**
 * Mock WordPress host for testing the embedded build.
 *
 * Serves the real `wordpress-plugin/.../assets` bundle inside a page that
 * mimics what the shortcode outputs (theme CSS, `window.NapNoxConfig`, a
 * `[data-napnox-root]` container) and implements the same REST contract as
 * the plugin - including WordPress's error envelope.
 *
 * It returns canned prompts, so the full success path can be exercised
 * without a Gemini key.
 *
 *   node scripts/mock-wordpress.mjs      ->  http://localhost:4000/
 *
 * Query flags: ?loggedout=1  ?used=10  ?unlimited=1
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'wordpress-plugin', 'napnox-prompt-generator', 'assets');
const PORT = Number(process.env.PORT || 4000);

const state = { used: 0, unlimited: false, loggedIn: true };

const usage = () => ({
  used: state.used,
  limit: 10,
  remaining: state.unlimited ? Number.MAX_SAFE_INTEGER : Math.max(0, 10 - state.used),
  unlimited: state.unlimited,
});

const session = () => ({
  loggedIn: state.loggedIn,
  user: state.loggedIn ? { name: 'Test Member', email: 'member@example.com' } : null,
  usage: state.loggedIn ? usage() : null,
  loginUrl: '/wp-login.php',
  registerUrl: '/register/',
  contact: {
    email: 'contact@napnox.com',
    whatsapp: '+923001234567',
    message: 'Get in touch to unlock unlimited prompt generation on your account.',
  },
  nonce: 'mock-nonce-refreshed',
});

const CANNED = [
  {
    text: "**Concept:** A rain-slicked Kyoto bookshop glowing amber against a blue evening.\n\n**Composition & Subject:** A narrow two-storey wooden machiya bookshop on a wet backstreet, warm light spilling from tall windows onto the pavement, a single customer silhouetted browsing shelves.\n\n**Lighting:** Low-key, warm interior tungsten against cool blue dusk, strong reflections in standing water.\n\n**Technical:** 35mm lens, f/1.8, shallow depth of field, cinematic colour grade. --ar 16:9 --style raw",
    tags: ['cinematic', 'photorealistic', 'midjourney', 'night'],
  },
  {
    text: "**Concept:** An intimate interior view from inside the bookshop looking out at the rain.\n\n**Composition & Subject:** Over-the-shoulder framing past stacked paperbacks toward a steamed window, droplets catching light, a cat asleep on the counter.\n\n**Lighting:** Soft practical lamps, warm pools of light, deep shadows between shelves.\n\n**Technical:** 50mm lens, f/2.0, soft bokeh, muted earth palette. --ar 3:2 --style raw",
    tags: ['cosy', 'interior', 'midjourney', 'warm'],
  },
  {
    text: "**Concept:** A wide establishing shot placing the bookshop in a quiet rainy alley.\n\n**Composition & Subject:** Symmetrical alley framing, paper lanterns receding into mist, the bookshop as the single warm anchor in a cool composition.\n\n**Lighting:** Blue hour ambient with warm accent pools, volumetric haze.\n\n**Technical:** 24mm lens, f/4, deep focus, high dynamic range. --ar 21:9 --style raw",
    tags: ['establishing shot', 'moody', 'midjourney', 'atmospheric'],
  },
];

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

const page = () => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Prompt Generator - Mock WP Theme</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/napnox-app.css" />
<style>
  /* Deliberately opinionated "theme" CSS, to prove the app's styles are
     scoped and that Tailwind's reset is not leaking out of the app. */
  body { margin:0; font-family: Georgia, serif; background:#1f2430; color:#e8e8e8; }
  .site-header { padding:18px 24px; background:#11141c; border-bottom:3px solid #e0b150; }
  .site-header h1 { margin:0; font-size:22px; letter-spacing:.5px; }
  .theme-content { max-width:1180px; margin:0 auto; padding:28px 16px 60px; }
  .theme-content > p { line-height:1.8; }
  button { background:#e0b150; border:4px solid red; padding:20px; font-size:22px; }
  h1,h2,h3 { font-family: Georgia, serif; }
</style>
</head>
<body>
  <header class="site-header"><h1>napnox.com &mdash; mock theme</h1></header>
  <div class="theme-content">
    <h2>AI Prompt Generator</h2>
    <p>Theme paragraph above the shortcode. The ugly red-bordered button below is theme CSS;
       it must stay ugly, and the app's own buttons must not inherit it.</p>
    <button>Theme button (should stay ugly)</button>

    <!-- what [napnox_prompt_generator] renders -->
    <div class="napnox-app" data-napnox-root></div>

    <p>Theme paragraph below the shortcode.</p>
  </div>
  <script>window.NapNoxConfig = ${JSON.stringify({
    restUrl: '/wp-json/napnox/v1/',
    nonce: 'mock-nonce-bootstrap',
    session: session(),
  })};</script>
  <script src="/assets/napnox-app.js"></script>
</body></html>`;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.searchParams.has('loggedout')) state.loggedIn = false;
  if (url.searchParams.has('login')) state.loggedIn = true;
  if (url.searchParams.has('used')) state.used = Number(url.searchParams.get('used'));
  if (url.searchParams.has('unlimited')) state.unlimited = url.searchParams.get('unlimited') === '1';

  if (url.pathname === '/' || url.pathname === '/index.html') {
    return send(res, 200, page(), 'text/html; charset=utf-8');
  }

  if (url.pathname.startsWith('/assets/')) {
    try {
      const file = join(assets, url.pathname.replace('/assets/', ''));
      const type = file.endsWith('.css') ? 'text/css' : 'application/javascript';
      return send(res, 200, readFileSync(file, 'utf8'), type);
    } catch {
      return send(res, 404, { message: 'Not found' });
    }
  }

  if (url.pathname === '/wp-json/napnox/v1/session') {
    return send(res, 200, session());
  }

  if (url.pathname === '/wp-json/napnox/v1/generate') {
    if (req.method !== 'POST') return send(res, 405, { code: 'rest_no_route', message: 'No route.' });

    if (!state.loggedIn) {
      // WordPress error envelope.
      return send(res, 401, {
        code: 'not_logged_in',
        message: 'Please sign in to generate prompts.',
        data: { status: 401 },
      });
    }
    if (!state.unlimited && state.used >= 10) {
      return send(res, 402, {
        code: 'limit_reached',
        message: 'You have used all 10 free generations. Contact us for unlimited access.',
        data: { status: 402, usage: usage() },
      });
    }

    state.used += 1;
    const now = Date.now();
    return send(res, 200, {
      requestId: `gen-${now}`,
      generatedAt: new Date(now).toISOString(),
      prompts: CANNED.map((p, i) => ({ id: `gen-${now}-${i}`, text: p.text, metadata: { tags: p.tags } })),
      usage: usage(),
    });
  }

  return send(res, 404, { code: 'rest_no_route', message: 'Not found' });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Mock WordPress host listening on http://0.0.0.0:${PORT}/`);
});
