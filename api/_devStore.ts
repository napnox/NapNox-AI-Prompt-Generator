import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import { MASTER_CONFIG } from '../masterConfig';

/**
 * DEVELOPMENT ONLY user + quota store.
 *
 * In production the WordPress plugin is the backend: accounts come from your
 * WP user registration plugin and the quota lives in WP user meta. This tiny
 * JSON-file store exists purely so the login gate and the 10-generation limit
 * can be exercised locally with `npm run dev`, without WordPress.
 */

const STORE_PATH = new URL('../.napnox-dev-users.json', import.meta.url);

export interface DevUser {
  id: string;
  email: string;
  name: string;
  used: number;
  unlimited: boolean;
}

interface StoreShape {
  users: Record<string, DevUser>;
  sessions: Record<string, string>;
}

const empty: StoreShape = { users: {}, sessions: {} };

function read(): StoreShape {
  try {
    if (!existsSync(STORE_PATH)) return structuredClone(empty);
    return { ...structuredClone(empty), ...JSON.parse(readFileSync(STORE_PATH, 'utf8')) };
  } catch {
    return structuredClone(empty);
  }
}

function write(store: StoreShape): void {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

export const SESSION_COOKIE = 'napnox_dev_session';

export function userFromRequest(request: Request): DevUser | null {
  const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
  if (!token) return null;
  const store = read();
  const userId = store.sessions[token];
  return userId ? (store.users[userId] ?? null) : null;
}

export function login(email: string, name: string): { user: DevUser; token: string } {
  const store = read();
  const id = createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
  const user: DevUser = store.users[id] ?? { id, email, name, used: 0, unlimited: false };
  user.name = name || user.name;
  store.users[id] = user;

  const token = randomUUID();
  store.sessions[token] = id;
  write(store);
  return { user, token };
}

export function logout(request: Request): void {
  const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
  if (!token) return;
  const store = read();
  delete store.sessions[token];
  write(store);
}

export function incrementUsage(userId: string): DevUser | null {
  const store = read();
  const user = store.users[userId];
  if (!user) return null;
  user.used += 1;
  write(store);
  return user;
}

export function usageFor(user: DevUser) {
  const limit = MASTER_CONFIG.defaults.freeLimit;
  return {
    used: user.used,
    limit,
    remaining: user.unlimited ? Number.MAX_SAFE_INTEGER : Math.max(0, limit - user.used),
    unlimited: user.unlimited,
  };
}
