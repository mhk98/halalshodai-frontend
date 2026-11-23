'use client';

import { api, API_URL } from './api-client';
import { BD_PHONE } from './format';

/**
 * Incomplete orders: once the visitor has typed a valid mobile number at checkout, the form so far
 * is saved on the server (debounced), so the shop can call them if they leave without ordering.
 * The same draft id goes with the order, which marks the draft converted.
 */
const KEY = 'checkout-draft-id';

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** This browser's draft id (kept until an order is placed). */
export function draftId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && /^[A-Za-z0-9-]{16,64}$/.test(existing)) return existing;
    const id = newId();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return newId();
  }
}

export function clearDraftId() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

export interface DraftPayload {
  phone: string;
  name?: string;
  email?: string;
  address?: string;
  deliveryZoneId?: number | null;
  items: { productId: number; variantId?: number | null; quantity: number }[];
}

let timer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let lastSent = ''; // last body the server accepted
let pending: string | null = null; // body waiting to be sent
const RETRY_MS = [3000, 10_000, 30_000];

function send(body: string, attempt = 0) {
  if (retryTimer) clearTimeout(retryTimer);
  api('/checkout/draft', { method: 'POST', body: JSON.parse(body) })
    .then(() => {
      lastSent = body;
      if (pending === body) pending = null;
    })
    .catch(() => {
      // API restarting / offline: try the same draft again a few times, unless the form changed meanwhile.
      if (attempt < RETRY_MS.length && pending === body) retryTimer = setTimeout(() => send(body, attempt + 1), RETRY_MS[attempt]);
    });
}

/** Leaving the page (tab closed / switched) before the debounce fired: send right away, surviving the unload. */
function flushOnLeave() {
  if (!pending || pending === lastSent) return;
  try {
    fetch(`${API_URL}/checkout/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: pending, keepalive: true, credentials: 'include' }).catch(() => {});
    lastSent = pending;
    pending = null;
    if (timer) clearTimeout(timer);
  } catch {
    /* ignore */
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushOnLeave);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushOnLeave());
}

/** Save the draft after a short pause in typing; nothing is sent without a valid number or items. */
export function saveDraftSoon(d: DraftPayload, delayMs = 1000) {
  const phone = d.phone.replace(/[\s-]/g, '');
  if (!BD_PHONE.test(phone) || !d.items.length) return;
  const body = JSON.stringify({ draftId: draftId(), ...d, phone });
  if (body === lastSent || body === pending) return;
  pending = body;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => send(body), delayMs);
}

/** Stop a pending save (the order is being placed). */
export function cancelDraftSave() {
  if (timer) clearTimeout(timer);
  if (retryTimer) clearTimeout(retryTimer);
  timer = null;
  retryTimer = null;
  pending = null;
}
