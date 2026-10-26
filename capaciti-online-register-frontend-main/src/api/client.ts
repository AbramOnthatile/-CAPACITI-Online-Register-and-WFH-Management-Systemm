import type { ApiErrorEnvelope } from './types';

const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/+$/, '');
const tokenKey = 'capaciti-token';

export class ApiError extends Error {
  code: string;
  fieldErrors: Record<string, string>;
  status: number;

  constructor(status: number, envelope: ApiErrorEnvelope) {
    super(envelope.message);
    this.name = 'ApiError';
    this.code = envelope.code;
    this.fieldErrors = envelope.fieldErrors;
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(tokenKey);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const requestUrl = `${baseUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(requestUrl, { ...options, headers });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Could not reach the API at ${baseUrl}. Check that the backend is running, VITE_API_BASE_URL is correct, and the backend allows this frontend origin through CORS.`,
      );
    }
    throw error;
  }
  if (!response.ok) {
    const envelope = (await response.json()) as ApiErrorEnvelope;
    throw new ApiError(response.status, envelope);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};

export const getApiToken = () => localStorage.getItem(tokenKey);
export const setApiToken = (token: string) => localStorage.setItem(tokenKey, token);
export const clearApiToken = () => localStorage.removeItem(tokenKey);
