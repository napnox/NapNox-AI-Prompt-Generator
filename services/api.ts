import type { ApiError, GenerateRequest, GenerateResponse, Session } from '../types';

/**
 * One API layer for both deployment modes.
 *
 * - WordPress: the plugin injects `window.NapNoxConfig` with the REST root,
 *   a nonce and a bootstrapped session, and requests authenticate with the
 *   visitor's normal WP login cookie.
 * - Standalone (`npm run dev`): falls back to the local `/api/*` dev routes.
 *
 * Either way the Gemini key stays on the server and the quota is enforced
 * there too - the browser is never trusted.
 */

interface WordPressConfig {
  restUrl: string;
  nonce: string;
  session?: Session;
}

/**
 * A page served from a full-page cache can carry a stale REST nonce. The
 * session response includes a fresh one, so adopt it for later requests.
 */
let liveNonce: string | undefined;

declare global {
  interface Window {
    NapNoxConfig?: WordPressConfig;
  }
}

const wp = (): WordPressConfig | undefined =>
  typeof window !== 'undefined' && window.NapNoxConfig?.restUrl ? window.NapNoxConfig : undefined;

export const isWordPress = (): boolean => Boolean(wp());

/** Session the plugin rendered into the page - avoids a round trip on load. */
export const bootstrapSession = (): Session | undefined => wp()?.session;

const endpoint = (route: 'session' | 'generate'): string => {
  const config = wp();
  if (!config) return `/api/${route}`;
  return config.restUrl.replace(/\/?$/, '/') + route;
};

const apiError = (message: string, status: number, code: string): ApiError =>
  Object.assign(new Error(message), { status, code });

async function request<T>(route: 'session' | 'generate', init: RequestInit = {}): Promise<T> {
  const config = wp();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  const nonce = liveNonce ?? config?.nonce;
  if (nonce) headers['X-WP-Nonce'] = nonce;

  let response: Response;
  try {
    response = await fetch(endpoint(route), {
      credentials: 'same-origin',
      ...init,
      headers,
    });
  } catch {
    throw apiError('Network error: could not reach the prompt service. Check your connection.', 0, 'network');
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // Handled below.
  }

  if (!response.ok) {
    // WordPress REST errors are {code, message, data:{status, ...}};
    // the dev routes use {error:{code, message}, usage}.
    const message =
      payload?.error?.message ?? payload?.message ?? 'Something went wrong. Please try again.';
    const code = payload?.error?.code ?? payload?.code ?? String(response.status);
    const error = apiError(message, response.status, String(code));
    const usage = payload?.usage ?? payload?.data?.usage;
    if (usage) (error as any).usage = usage;
    throw error;
  }

  if (!payload) throw apiError('Received an unexpected response from the server.', response.status, 'bad_payload');
  return payload as T;
}

export const getSession = async (): Promise<Session> => {
  const session = await request<Session & { nonce?: string }>('session');
  if (session.nonce) liveNonce = session.nonce;
  return session;
};

export const generatePrompts = (body: GenerateRequest): Promise<GenerateResponse> =>
  request<GenerateResponse>('generate', { method: 'POST', body: JSON.stringify(body) });

/** Dev-only helpers; in WordPress users sign in through WordPress itself. */
export const devLogin = (email: string, name?: string): Promise<Session> =>
  request<Session>('session', { method: 'POST', body: JSON.stringify({ email, name }) });

export const devLogout = (): Promise<Session> =>
  request<Session>('session', { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
