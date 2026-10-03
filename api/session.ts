import { json, fail } from './_shared';
import { SESSION_COOKIE, login, logout, userFromRequest, usageFor } from './_devStore';

/**
 * DEVELOPMENT ONLY session endpoint, mirroring the shape of the WordPress
 * plugin's `napnox/v1/session` route so the UI code is identical in both.
 *
 * GET  /api/session           -> current session
 * POST /api/session {login}   -> sign in as a fake user
 * POST /api/session {logout}  -> sign out
 */

const contact = {
  email: process.env.NAPNOX_CONTACT_EMAIL || 'contact@napnox.com',
  whatsapp: process.env.NAPNOX_CONTACT_WHATSAPP || '',
  message: 'Contact NapNox to unlock unlimited prompt generation.',
};

const sessionBody = (request: Request) => {
  const user = userFromRequest(request);
  return {
    loggedIn: Boolean(user),
    user: user ? { name: user.name, email: user.email } : null,
    usage: user ? usageFor(user) : null,
    loginUrl: '',
    registerUrl: '',
    contact,
    notice: process.env.GEMINI_API_KEY
      ? undefined
      : 'Dev server: GEMINI_API_KEY is not set, so generation will fail. Add it to .env.local.',
  };
};

export async function handleSession(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    return json(sessionBody(request));
  }

  if (request.method !== 'POST') return fail('Method not allowed.', 405);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return fail('Could not read the request body.', 400);
  }

  if (body?.action === 'logout') {
    logout(request);
    return json(
      { ...sessionBody(new Request(request.url)), loggedIn: false, user: null, usage: null },
      200,
      { 'set-cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` },
    );
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail('Enter a valid email address.', 400);
  }
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : email.split('@')[0];

  const { token } = login(email, name);
  const headers = {
    'set-cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
  };
  const withCookie = new Request(request.url, { headers: { cookie: `${SESSION_COOKIE}=${token}` } });
  return json(sessionBody(withCookie), 200, headers);
}

export default handleSession;
