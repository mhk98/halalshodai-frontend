'use client';

import { useAuthStore } from '@/store/auth';

/**
 * Browser API client: sends the access token, the guest cart session id and the
 * refresh cookie (credentials: include). Refreshes the access token once on 401.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.halalshodai.xyz/api/v1').replace(/\/$/, '');
const SESSION_KEY = 'cart_session';

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: { path: string; message: string }[];
  constructor(status: number, message: string, code?: string, errors?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export const cartSession = {
  get: () => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  },
  set: (id: string | null) => {
    try {
      if (id) localStorage.setItem(SESSION_KEY, id);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* private mode */
    }
  },
};

let refreshing: Promise<string | null> | null = null;

/** Exchange the refresh cookie for a new access token (single flight). */
export function refreshSession(): Promise<string | null> {
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        const store = useAuthStore.getState();
        if (!res.ok) {
          if (res.status === 401 || store.status !== 'authenticated') store.clear();
          return null;
        }
        const { data } = await res.json();
        store.setSession(data.user, data.accessToken);
        return data.accessToken as string;
      })
      .catch(() => {
        const store = useAuthStore.getState();
        if (store.status !== 'authenticated') store.clear();
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
}

export async function api<T = unknown>(path: string, { method = 'GET', body, retry = true }: RequestOpts = {}): Promise<{ data: T; meta?: unknown; message?: string }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = useAuthStore.getState().accessToken;
  if (token) headers.Authorization = `Bearer ${token}`;
  const session = cartSession.get();
  if (session) headers['X-Session-Id'] = session;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Network error. Please check your connection.');
  }

  if (res.status === 401 && retry && token && !path.startsWith('/auth/')) {
    const fresh = await refreshSession();
    if (fresh) return api<T>(path, { method, body, retry: false });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.message || 'Something went wrong', json.code, json.errors);
  return json;
}
