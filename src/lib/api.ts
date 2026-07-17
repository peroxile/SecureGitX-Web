import axios, { AxiosError } from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://api.securegitx.dev';

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super('Too many requests');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AuthError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthError';
  }
}

// CSRF token held in module memory — never in localStorage / sessionStorage
let csrfToken: string | null = null;

export async function fetchCsrf(): Promise<string> {
  const res = await client.get<{ token: string }>('/auth/csrf');
  csrfToken = res.data.token;
  return csrfToken;
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  withCredentials: true,         // httpOnly cookie transport
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',  // CSRF signal
  },
});

const MUTATING = new Set(['post', 'put', 'patch', 'delete']);

client.interceptors.request.use((config) => {
  if (csrfToken && config.method && MUTATING.has(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 429) {
      const after = Number(err.response.headers['retry-after'] ?? 60);
      return Promise.reject(new RateLimitError(after));
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      csrfToken = null;
      const msg = (err.response.data as { message?: string })?.message;
      return Promise.reject(new AuthError(msg));
    }
    return Promise.reject(err);
  }
);

export default client;
