import { UserRole } from '../../api/types';

const sessionStorageKey = 'capaciti-session';
const maxTimerDelay = 2_147_000_000;

interface ApiSession {
  token: string;
  expiresAt: number | null;
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

function expireSession(redirect: boolean): void {
  stopExpirationTimer();
  session = null;
  sessionLoaded = true;
  removeStoredSession();
  if (redirect) redirectToLogin();
}

function scheduleExpiration(): void {
  stopExpirationTimer();
  if (session?.expiresAt === null || session?.expiresAt === undefined) return;

  const remaining = session.expiresAt - Date.now();
  if (remaining <= 0) {
    expireSession(true);
    return;
  }

  expirationTimer = setTimeout(() => {
    if (session?.expiresAt !== null && session?.expiresAt !== undefined && session.expiresAt <= Date.now()) {
      expireSession(true);
    } else {
      scheduleExpiration();
    }
  }, Math.min(remaining, maxTimerDelay));
}

function restoreSession(): ApiSession | null {
  if (sessionLoaded) {
    if (session?.expiresAt !== null && session?.expiresAt !== undefined && session.expiresAt <= Date.now()) {
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
      || !('expiresAt' in parsed)
      || (parsed.expiresAt !== null && typeof parsed.expiresAt !== 'number')
    ) {
      removeStoredSession();
      return null;
    }
    session = { token: parsed.token, expiresAt: parsed.expiresAt };
    if (session.expiresAt !== null && session.expiresAt <= Date.now()) {
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

export function setApiToken(token: string, expiresAt?: string): void {
  if (!token) throw new Error('The API did not provide an authentication token.');

  const existingSession = restoreSession();
  let expiresAtMilliseconds = existingSession?.token === token ? existingSession.expiresAt : null;
  if (expiresAt !== undefined) {
    expiresAtMilliseconds = Date.parse(expiresAt);
    if (!Number.isFinite(expiresAtMilliseconds)) {
      throw new Error('The API returned an invalid session expiry time.');
    }
    if (expiresAtMilliseconds <= Date.now()) {
      expireSession(false);
      throw new Error('The authentication session has expired.');
    }
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
  expireSession(false);
  if (options.redirect !== false && hadSession) redirectToLogin();
}

export function isUserRole(role: unknown): role is UserRole {
  return role === UserRole.CANDIDATE
    || role === UserRole.TECH_CHAMP
    || role === UserRole.ADMIN;
}
