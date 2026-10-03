<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NapNox AI Prompt Generator

One master prompt generator covering all 14 categories. A member describes
their idea in plain language, optionally picks a category, and gets back
several polished, ready-to-paste prompts for any AI tool.

It is a **single generator**, not 14 separate ones: pick a category from the
dropdown and the form swaps in that category's own subtypes, filters and
target platforms. Every original category, subtype, filter and prompt template
is preserved verbatim. Leave it on **Auto-detect** and the master template
works out the medium for you.

Built to embed in WordPress, where **your registered users are the accounts**:
only logged-in members can generate, each gets **10 free generations** counted
against their WordPress account, and after that they contact you for unlimited
access.

---

## How it works

| | |
|---|---|
| **Categories** | All 14 originals, with every subtype, filter and prompt template, inside one generator. |
| **Who can generate** | Logged-in WordPress users only. Signed-out visitors see a sign-in gate. |
| **Free allowance** | 10 generations per account (configurable in wp-admin). |
| **Where the count lives** | WordPress user meta — not a cookie or localStorage, so clearing the browser, switching device or using private browsing does **not** reset it. |
| **After the limit** | A modal invites them to contact you by email or WhatsApp. You grant unlimited with one checkbox on their user profile. |
| **Where the API key lives** | On your server (wp-config.php or the plugin settings). It is never sent to the browser. |

---

## Install on WordPress

1. **Build the plugin:**
   ```bash
   npm install
   npm run package:wp
   ```
   This produces `wordpress-plugin/dist/napnox-prompt-generator.zip`.

2. **Upload it** in wp-admin under *Plugins → Add New → Upload Plugin*, then activate.

3. **Add your Gemini API key.** Either (preferred) put it in `wp-config.php`,
   so it never touches the database:
   ```php
   define( 'NAPNOX_GEMINI_API_KEY', 'your-key-here' );
   ```
   …or paste it under *Settings → NapNox Prompts*. Get a key from
   [Google AI Studio](https://aistudio.google.com/apikey).

4. **Set your contact details** under *Settings → NapNox Prompts* — the email
   address and/or WhatsApp number members use to ask for unlimited access, plus
   the free limit (default 10).

5. **Place the generator** on any page or post:
   ```
   [napnox_prompt_generator]
   ```

### Granting unlimited access

When a member contacts you, go to *Users*, edit them, and tick **Unlimited
prompt generations**. The same screen shows how many they have used and lets you
reset their counter. The *Users* list also has a **Prompts** column showing
everyone's usage at a glance.

To grant unlimited automatically to a paid membership role, add a filter:

```php
add_filter( 'napnox_user_is_unlimited', function ( $unlimited, $user_id ) {
    return $unlimited || user_can( $user_id, 'premium_member' );
}, 10, 2 );
```

### Pointing sign-in at your registration plugin

By default the gate links to `wp-login.php`. If your registration plugin uses
custom pages:

```php
add_filter( 'napnox_login_url',    fn() => home_url( '/login/' ) );
add_filter( 'napnox_register_url', fn() => home_url( '/register/' ) );
```

### ⚠️ Caching

Exclude the page containing the shortcode from full-page caching. A cached page
serves a stale REST nonce and a stale logged-in state, which makes members look
signed out. (The app refetches the session and adopts a fresh nonce on load,
which recovers most cases, but excluding the page is the reliable fix.)

---

## Local development (no WordPress needed)

```bash
npm install
cp .env.example .env.local     # add your GEMINI_API_KEY
npm run dev                    # http://localhost:3000
```

The Vite dev server runs the handlers in `api/` so the app works standalone. It
provides a throwaway email sign-in and a JSON-file quota store
(`.napnox-dev-users.json`) that stand in for WordPress, so the login gate and
the 10-generation limit can be exercised locally.

To check the **embedded** build against a WordPress-shaped host without
installing WordPress:

```bash
npm run build:wp
node scripts/mock-wordpress.mjs   # http://localhost:4000
```

That serves the real plugin bundle inside a mock theme with a mock REST API
returning canned prompts. Useful query flags: `?loggedout=1`, `?used=10`,
`?unlimited=1`.

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Standalone dev server with the local API routes. |
| `npm run build` | Standalone SPA build into `dist/`. |
| `npm run build:wp` | Builds the bundle into the plugin's `assets/`. |
| `npm run package:wp` | `build:wp` + copies shared config + zips the plugin. |
| `npm run typecheck` | `tsc --noEmit`. |
| `python3 scripts/check-php.py` | Static check of the plugin PHP (bracket balance + cross-class references). Not a substitute for `php -l`. |

---

## Project layout

```
shared/master-config.json   All 14 categories with their subtypes, filters,
                            platform options and original prompt templates,
                            plus the auto-detect master template, detail
                            levels and limits. Read by BOTH the React client
                            and the PHP backend, so the two cannot drift.

masterConfig.ts             Typed accessor for that JSON (client).
App.tsx                     Session gate -> master form -> results.
components/                 UI: MasterPromptForm, LoginGate, UsageMeter,
                            PromptResults, PromptCard, UpgradeModal.
services/api.ts             One API layer; talks to the WP REST routes when
                            embedded, the local /api routes when standalone.

api/                        Local DEV backend only (Vite dev server).
wordpress-plugin/           The production backend: shortcode, REST routes,
                            quota in user meta, settings screen, Gemini client.
```

## Security notes

- The Gemini API key is read server-side per request and never reaches the
  browser. Verify with `grep -r "AIzaSy" wordpress-plugin/*/assets/` — it should
  return nothing.
- `/wp-json/napnox/v1/generate` requires `is_user_logged_in()` and validates
  every field against `shared/master-config.json` before spending a token —
  category, subtype, target platform and each filter value must match the
  original definitions — so it cannot be used as an open proxy to your Gemini
  quota.
- Requests are throttled to one generation every 3 seconds per user, and the
  quota is only charged on a **successful** generation.
- Upstream failures are logged server-side (with `WP_DEBUG` on) but the browser
  only ever receives a generic, safe message.
