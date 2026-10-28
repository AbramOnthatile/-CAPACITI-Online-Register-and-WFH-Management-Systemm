import { UserRole } from '../../api/types';

const sessionStorageKey = 'capaciti-session';
const sessionExpiredEvent = 'capaciti:session-expired';
const maxTimerDelay = 2_147_000_000;

interface ApiSession {
  token: string;
  expiresAt: number;
}

let session: ApiSession | null = null;
let sessionLoaded = false;
let loginRedirectStarted = false;
let expirationTimer: ReturnType<typeof setTimeout> | undefined;

function redirectToLogin(): void {
  if (
    typeof window === 'undefined'
    || window.location.pathname === '/login'
    || loginRedirectStarted
  ) return;
  loginRedirectStarted = true;
  window.location.replace('/login');
}

function stopExpirationTimer(): void {
  if (expirationTimer !== undefined) clearTimeout(expirationTimer);
  expirationTimer = undefined;
}

function removeStoredSession(): void {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(sessionStorageKey);
}

function notifySessionExpired(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(sessionExpiredEvent));
}

function expireSession(redirect: boolean, notify = redirect): void {
  stopExpirationTimer();
  session = null;
  sessionLoaded = true;
  removeStoredSession();
  if (notify) notifySessionExpired();
  if (redirect) redirectToLogin();
}

function scheduleExpiration(): void {
  stopExpirationTimer();
  if (!session) return;

  const remaining = session.expiresAt - Date.now();
  if (remaining <= 0) {
    expireSession(true);
    return;
  }

  expirationTimer = setTimeout(() => {
    if (session && session.expiresAt <= Date.now()) {
      expireSession(true);
    } else {
      scheduleExpiration();
    }
  }, Math.min(remaining, maxTimerDelay));
}

function restoreSession(): ApiSession | null {
  if (sessionLoaded) {
    if (session && session.expiresAt <= Date.now()) {
      expireSession(true);
    }
    return session;
  }
  sessionLoaded = true;
  if (typeof window === 'undefined') return null;

  const saved = window.sessionStorage.getItem(sessionStorageKey);
  if (!saved) return null;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (
      typeof parsed !== 'object'
      || parsed === null
      || !('token' in parsed)
      || typeof parsed.token !== 'string'
      || !parsed.token
      || !('expiresAt' in parsed)
      || typeof parsed.expiresAt !== 'number'
      || !Number.isFinite(parsed.expiresAt)
    ) {
      removeStoredSession();
      return null;
    }
    session = { token: parsed.token, expiresAt: parsed.expiresAt };
    if (session.expiresAt <= Date.now()) {
      expireSession(false);
      return null;
    }
    scheduleExpiration();
    return session;
  } catch {
    removeStoredSession();
    return null;
  }
}

export function getApiToken(): string | null {
  return restoreSession()?.token ?? null;
}

export function setApiToken(token: string, expiresAt: string): void {
  if (!token) throw new Error('The API did not provide an authentication token.');

  const expiresAtMilliseconds = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMilliseconds)) {
    throw new Error('The API returned an invalid session expiry time.');
  }
  if (expiresAtMilliseconds <= Date.now()) {
    expireSession(false);
    throw new Error('The authentication session has expired.');
  }

  session = { token, expiresAt: expiresAtMilliseconds };
  sessionLoaded = true;
  loginRedirectStarted = false;
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(session));
  }
  scheduleExpiration();
}

export function clearApiToken(options: { redirect?: boolean } = {}): void {
  const hasSavedSession = !sessionLoaded
    && typeof window !== 'undefined'
    && window.sessionStorage.getItem(sessionStorageKey) !== null;
  const hadSession = Boolean(session?.token) || hasSavedSession;
  expireSession(false, false);
  if (options.redirect !== false && hadSession) {
    notifySessionExpired();
    redirectToLogin();
  }
}

export function isUserRole(role: unknown): role is UserRole {
  return role === UserRole.CANDIDATE
    || role === UserRole.TECH_CHAMP
    || role === UserRole.ADMIN;
}
