import 'server-only';
import type { PaginationMeta } from '@/types';

/**
 * Server-side API access for Server Components (ISR-cached via fetch's `next.revalidate`).
 * Uses API_INTERNAL_URL when set (e.g. Docker network), else NEXT_PUBLIC_API_URL.
 */
const API = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.halalshodai.xyz/api/v1').replace(/\/$/, '');

interface Opts {
  revalidate?: number | false;
  tags?: string[];
}

export interface ApiResult<T> {
  data: T;
  meta?: PaginationMeta & Record<string, unknown>;
}

/** GET and unwrap; returns null on 404, throws on other errors. */
export async function apiGet<T>(path: string, { revalidate = 60, tags }: Opts = {}): Promise<ApiResult<T> | null> {
  const url = `${API}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate, tags },
      headers: {
        Accept: 'application/json',
        // All visitors' SSR requests come from this server's IP; the key exempts them from the API's per-IP rate limit.
        ...(process.env.INTERNAL_API_KEY ? { 'X-Internal-Key': process.env.INTERNAL_API_KEY } : {}),
      },
    });
  } catch (err) {
    // Node's fetch only says "fetch failed"; the real reason (ECONNREFUSED, ENOTFOUND, timeout…) is in `cause`.
    const cause = (err as { cause?: { code?: string; message?: string } }).cause;
    throw new Error(`cannot reach ${url} (${cause?.code || cause?.message || (err as Error).message})`);
  }
  if (res.status === 404) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[api] 404 for ${url}`);
    return null;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const json = await res.json();
  return { data: json.data as T, meta: json.meta };
}

/**
 * Like apiGet but never throws (for non-critical page sections); returns fallback on failure.
 * Failures are logged on the Next.js server console (the terminal running `next dev` / `next start`), not in the browser.
 */
export async function apiGetSafe<T>(path: string, fallback: T, opts?: Opts): Promise<T> {
  try {
    return (await apiGet<T>(path, opts))?.data ?? fallback;
  } catch (err) {
    console.error(`[api] ${path} failed, rendering without it: ${(err as Error).message}`);
    return fallback;
  }
}

/** Build a query string from defined values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : '';
}
