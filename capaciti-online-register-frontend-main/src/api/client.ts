import type { ApiErrorEnvelope } from './types';
import { clearApiToken, getApiToken, setApiToken } from '../lib/auth/session';

const requestTimeoutMs = 15_000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFieldErrors(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function createApiError(status: number, body: unknown, _statusText: string): ApiError {
  let code = 'HTTP_ERROR';
  let message = '';
  let fieldErrors: Record<string, string> = {};
  if (isRecord(body)) {
    const envelope = body as Partial<ApiErrorEnvelope>;
    if (typeof envelope.code === 'string') code = envelope.code;
    if (typeof envelope.message === 'string') message = envelope.message;
    fieldErrors = toFieldErrors(envelope.fieldErrors);
  }

  if (status === 401) return new ApiError(status, code, 'Your session has expired. Please sign in again.', fieldErrors);
  if (status === 403) return new ApiError(status, code, 'You do not have permission to perform this action.', fieldErrors);
  if (status === 404) return new ApiError(status, code, 'The requested item could not be found.', fieldErrors);
  if (status === 409) {
    const conflictMessages: Record<string, string> = {
      ALREADY_CLOCKED_IN: 'You are already clocked in.',
      WFH_OVERLAP: 'This WFH request overlaps an existing request.',
      PROMPT_EXPIRED: 'This check-in window has expired. Available prompts will refresh.',
      PROMPT_ALREADY_SUBMITTED: 'This check-in has already been submitted.',
      ASSESSMENT_LOCKED: 'This assessment is locked and cannot be changed.',
    };
    return new ApiError(status, code, message || conflictMessages[code] || 'This action conflicts with the current state. Refresh and try again.', fieldErrors);
  }
  if (status === 400 && code === 'VALIDATION_FAILED') {
    return new ApiError(status, code, message || 'Please correct the highlighted fields.', fieldErrors);
  }
  if (status === 400) return new ApiError(status, code, 'Please check the submitted information.', fieldErrors);
  if (status >= 500) return new ApiError(status, code, 'The service is temporarily unavailable. Please try again.');
  return new ApiError(status, code, 'The request could not be completed. Please try again.', fieldErrors);
}

export function getFieldError(fieldErrors: Record<string, string>, ...fieldNames: string[]): string | undefined {
  const normalize = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const names = new Set(fieldNames.map(normalize));
  return Object.entries(fieldErrors).find(([key]) => {
    const normalizedKey = normalize(key);
    return [...names].some((name) => normalizedKey === name || normalizedKey.endsWith(name));
  })?.[1];
}

export function getUserErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function canRetryError(error: unknown): boolean {
  return error instanceof ApiError
    ? error.status >= 500 || error.status === 0 || error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT'
    : false;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');
  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }

  const method = options.method ?? 'GET';
  const token = getApiToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? requestTimeoutMs;
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) onAbort();
  else options.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) throw new ApiError(0, 'TIMEOUT', 'The request timed out. Check your connection and try again.');
      if (options.signal?.aborted) throw error;
      if (error instanceof TypeError) {
        throw new ApiError(0, 'NETWORK_ERROR', 'Could not connect to the service. Check your connection and try again.');
      }
      throw error;
    }

    const responseBody = await readResponseBody(response);
    if (!response.ok) {
      if (response.status === 401 && token) {
        clearApiToken();
      }
      throw createApiError(response.status, responseBody, response.statusText);
    }

    if (responseBody === undefined) return undefined as T;
    if (typeof responseBody === 'string') {
      throw new ApiError(response.status, 'INVALID_RESPONSE', 'The API returned a non-JSON success response.');
    }
    return responseBody as T;
  } catch (error) {
    if (timedOut) throw new ApiError(0, 'TIMEOUT', 'The request timed out. Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onAbort);
  }
}

type RequestExtras = Omit<ApiRequestOptions, 'method' | 'body'>;

export const apiClient = {
  get: <T>(path: string, options?: RequestExtras) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestExtras) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body: unknown, options?: RequestExtras) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestExtras) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestExtras) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

export { clearApiToken, getApiToken, setApiToken };
