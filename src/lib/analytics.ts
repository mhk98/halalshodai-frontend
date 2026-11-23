'use client';

/**
 * Marketing / analytics events: Facebook (Meta) Pixel, TikTok Pixel, Google Ads conversions and GA4.
 * They no-op for platforms that aren't loaded (not configured in admin → Marketing Tools), so call
 * sites never need to check.
 *
 * Server-side copies (Meta Conversions API, TikTok Events API): each event gets one ID, used by the
 * Facebook Pixel (`eventID`), the TikTok Pixel (`event_id`) and a copy posted to the API
 * (`/activity`), which forwards it with the visitor's IP / user agent and hashed contact details.
 * Each platform keeps one of its two copies (deduplication). Purchase isn't posted from here: the
 * server sends it from the order with the id `purchase-<order number>`.
 *
 * Google Ads is browser-only: a conversion per configured label; Purchase uses the order number as
 * transaction_id so it's counted once, and Enhanced Conversions get the customer's email / phone.
 */
import { API_URL } from './api-client';
import { useAuthStore } from '@/store/auth';

type Item = { id: number | string; name: string; price: number; quantity?: number; variant?: string | null };
/** Contact details typed at checkout; hashed before they reach Meta / TikTok. */
export type TrackUser = { phone?: string; email?: string; name?: string; district?: string };
type GoogleAdsLabels = { purchase?: string; addToCart?: string; beginCheckout?: string; lead?: string; signUp?: string };
export type GoogleAdsConfig = { id: string; labels: GoogleAdsLabels; enhanced: boolean };

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void; page: () => void; identify: (data: Record<string, string>) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

const config = { serverEvents: false, googleAds: null as GoogleAdsConfig | null, facebook: false, tiktok: false, gtag: false };

/** Called by <Analytics> with the admin settings: which platforms are loaded and whether server copies are sent. */
export function configureTracking(opts: { serverEvents: boolean; googleAds?: GoogleAdsConfig | null; facebook?: boolean; tiktok?: boolean; gtag?: boolean }) {
  config.serverEvents = opts.serverEvents;
  config.googleAds = opts.googleAds ?? null;
  config.facebook = Boolean(opts.facebook);
  config.tiktok = Boolean(opts.tiktok);
  config.gtag = Boolean(opts.gtag);
}

/**
 * The platform scripts load after the page becomes interactive, but the first events (PageView,
 * ViewContent) fire as the page mounts. Calls made before a configured platform is ready are held
 * (same event ids) and replayed once its script has defined fbq / ttq / gtag (up to 15 s).
 */
type Platform = 'facebook' | 'tiktok' | 'gtag';
const ready: Record<Platform, () => boolean> = {
  facebook: () => typeof window.fbq === 'function',
  tiktok: () => Boolean(window.ttq),
  gtag: () => typeof window.gtag === 'function',
};
const pending: { platform: Platform; run: () => void; at: number }[] = [];
let pendingTimer: ReturnType<typeof setInterval> | null = null;

function call(platform: Platform, run: () => void) {
  if (ready[platform]()) return run();
  if (!config[platform]) return; // not configured: nothing to wait for
  pending.push({ platform, run, at: Date.now() });
  pendingTimer ??= setInterval(() => {
    for (let i = 0; i < pending.length; ) {
      const p = pending[i];
      if (ready[p.platform]()) p.run();
      else if (Date.now() - p.at < 15_000) { i += 1; continue; }
      pending.splice(i, 1);
    }
    if (!pending.length && pendingTimer) {
      clearInterval(pendingTimer);
      pendingTimer = null;
    }
  }, 200);
}
const fbq = (...args: unknown[]) => call('facebook', () => window.fbq?.(...args));
const ttq = { track: (...args: unknown[]) => call('tiktok', () => window.ttq?.track(...args)), page: () => call('tiktok', () => window.ttq?.page()) };
const gtag = (...args: unknown[]) => call('gtag', () => window.gtag?.(...args));

const newEventId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const cookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];

/** An ad click id from the landing URL (?fbclid= / ?ttclid=), remembered for the visit. */
function clickId(param: string, store: string, format: (id: string) => string = (id) => id) {
  try {
    const id = new URLSearchParams(window.location.search).get(param);
    if (id) sessionStorage.setItem(store, format(id));
    return sessionStorage.getItem(store) || undefined;
  } catch {
    return undefined;
  }
}
/** _fbc: set by the Facebook Pixel after an ad click; rebuilt from ?fbclid= when the cookie is missing. */
const fbc = () => cookie('_fbc') || clickId('fbclid', 'fbc', (id) => `fb.1.${Date.now()}.${id}`);
const ttclid = () => clickId('ttclid', 'ttclid');

/** Cookies, click ids and page URL for the order, so server-side Purchases match this visitor. */
export const trackingContext = () => ({ fbp: cookie('_fbp'), fbc: fbc(), ttp: cookie('_ttp'), ttclid: ttclid(), sourceUrl: window.location.href });

type ServerData = { value?: number; contentIds?: string[]; contentName?: string; contentType?: string; numItems?: number; searchString?: string; paymentMethod?: string };

/** Post the server copy (fire-and-forget; keepalive so it survives page navigation). */
function mirror(event: string, eventId: string, data?: ServerData, user?: TrackUser) {
  if (!config.serverEvents) return;
  const token = useAuthStore.getState().accessToken;
  fetch(`${API_URL}/activity`, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ event, eventId, url: window.location.href, fbp: cookie('_fbp'), fbc: fbc(), ttp: cookie('_ttp'), ttclid: ttclid(), data, user }),
  }).catch(() => {});
}

const ga = (event: string, params: Record<string, unknown>) => gtag('event', event, params);

/** Google Ads conversion for one action, if a label is configured for it. */
function adsConversion(action: keyof GoogleAdsLabels, params: { value?: number; transactionId?: string } = {}) {
  const ads = config.googleAds;
  const label = ads?.labels[action];
  if (!ads || !label) return;
  gtag('event', 'conversion', {
    send_to: `${ads.id}/${label}`,
    ...(params.value !== undefined ? { value: params.value, currency: 'BDT' } : {}),
    ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
  });
}

/** Facebook + TikTok browser events and the server copy, all with the same event id. */
function emit(
  name: string,
  fbParams: Record<string, unknown>,
  ttParams: Record<string, unknown> | null,
  server?: { data?: ServerData; user?: TrackUser },
  ttName = name,
) {
  const eventId = newEventId();
  fbq('track', name, fbParams, { eventID: eventId });
  if (ttParams) ttq.track(ttName, ttParams, { event_id: eventId });
  mirror(name, eventId, server?.data, server?.user);
}

const ttContents = (items: Item[]) =>
  items.map((i) => ({ content_id: String(i.id), content_type: 'product', content_name: i.name, quantity: i.quantity ?? 1, price: i.price }));

const gaItems = (items: Item[]) =>
  items.map((i) => ({ item_id: String(i.id), item_name: i.name, price: i.price, quantity: i.quantity ?? 1, item_variant: i.variant ?? undefined }));

/** Bangladeshi mobile → E.164 (+8801…). */
const e164 = (phone?: string) => {
  const d = String(phone || '').replace(/\D/g, '');
  if (!d) return undefined;
  return `+${d.length === 11 && d.startsWith('01') ? `88${d}` : d}`;
};

const sha256 = async (v: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
};

/** Customer details for browser-side matching: Google Enhanced Conversions and TikTok advanced matching. */
async function identify(user: TrackUser) {
  const email = user.email?.trim().toLowerCase() || undefined;
  const phone = e164(user.phone);
  if (config.googleAds?.enhanced) {
    // Google hashes these itself before sending.
    gtag('set', 'user_data', { ...(email ? { email } : {}), ...(phone ? { phone_number: phone } : {}) });
  }
  if (window.ttq && (email || phone)) {
    try {
      window.ttq.identify({ ...(email ? { email: await sha256(email) } : {}), ...(phone ? { phone_number: await sha256(phone) } : {}) });
    } catch {
      /* SubtleCrypto unavailable (non-HTTPS); skip */
    }
  }
}

/** GA4 page view (queued until gtag.js is ready, like the pixel calls). */
export const gaPageView = (gaId: string, path: string) => gtag('event', 'page_view', { page_path: path, send_to: gaId });

export const track = {
  /** Page view: Facebook (+ server copy) and TikTok; GA4 page_view is sent by <Analytics>. */
  pageView() {
    const eventId = newEventId();
    fbq('track', 'PageView', {}, { eventID: eventId });
    ttq.page();
    mirror('PageView', eventId);
  },
  viewItem(item: Item) {
    ga('view_item', { currency: 'BDT', value: item.price, items: gaItems([item]) });
    emit(
      'ViewContent',
      { content_ids: [String(item.id)], content_name: item.name, content_type: 'product', value: item.price, currency: 'BDT' },
      { contents: ttContents([item]), value: item.price, currency: 'BDT' },
      { data: { contentIds: [String(item.id)], contentName: item.name, value: item.price } },
    );
  },
  addToCart(item: Item) {
    const value = item.price * (item.quantity ?? 1);
    ga('add_to_cart', { currency: 'BDT', value, items: gaItems([item]) });
    adsConversion('addToCart', { value });
    emit(
      'AddToCart',
      { content_ids: [String(item.id)], content_name: item.name, content_type: 'product', value, currency: 'BDT' },
      { contents: ttContents([item]), value, currency: 'BDT' },
      { data: { contentIds: [String(item.id)], contentName: item.name, value, numItems: item.quantity ?? 1 } },
    );
  },
  beginCheckout(items: Item[], value: number) {
    ga('begin_checkout', { currency: 'BDT', value, items: gaItems(items) });
    adsConversion('beginCheckout', { value });
    const ids = items.map((i) => String(i.id));
    emit(
      'InitiateCheckout',
      { content_ids: ids, num_items: items.length, value, currency: 'BDT' },
      { contents: ttContents(items), value, currency: 'BDT' },
      { data: { contentIds: ids, numItems: items.length, value } },
    );
  },
  /** Customer chose a payment method and is placing the order. */
  addPaymentInfo(items: Item[], value: number, paymentMethod: string, user: TrackUser) {
    void identify(user);
    ga('add_payment_info', { currency: 'BDT', value, payment_type: paymentMethod, items: gaItems(items) });
    const ids = items.map((i) => String(i.id));
    emit(
      'AddPaymentInfo',
      { content_ids: ids, value, currency: 'BDT' },
      { contents: ttContents(items), value, currency: 'BDT' },
      { data: { contentIds: ids, value, paymentMethod }, user },
    );
  },
  /** Browser half of Purchase; the server sends its half from the order with the same event id. */
  purchase(orderNumber: string, items: Item[], value: number) {
    const eventId = `purchase-${orderNumber}`;
    ga('purchase', { transaction_id: orderNumber, currency: 'BDT', value, items: gaItems(items) });
    adsConversion('purchase', { value, transactionId: orderNumber });
    fbq('track', 'Purchase', { content_ids: items.map((i) => String(i.id)), content_type: 'product', value, currency: 'BDT' }, { eventID: eventId });
    ttq.track('Purchase', { contents: ttContents(items), value, currency: 'BDT' }, { event_id: eventId });
  },
  search(term: string) {
    ga('search', { search_term: term });
    emit('Search', { search_string: term }, { query: term }, { data: { searchString: term } });
  },
  completeRegistration() {
    ga('sign_up', {});
    adsConversion('signUp');
    emit('CompleteRegistration', {}, {});
  },
  /** e.g. the Hakim consultation button. TikTok has no "Lead" event; its closest is "Contact". */
  lead(name: string) {
    ga('generate_lead', { lead_source: name });
    adsConversion('lead');
    emit('Lead', { content_name: name }, { description: name }, { data: { contentName: name } }, 'Contact');
  },
};
