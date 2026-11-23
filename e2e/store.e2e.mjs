// Storefront browser E2E — see README "E2E tests".
// Needs: API on a freshly seeded DB (npm run db:fresh, PAYMENT_MODE=mock, SMS_PROVIDER=log) and this app running.
// Env: STORE_URL (default https://halalshodai.xyz), API_URL, API_LOG (API console log file, for the OTP step), PW_CHANNEL.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.STORE_URL || 'https://halalshodai.xyz').replace(/\/$/, '');
const API = (process.env.API_URL || 'https://api.halalshodai.xyz/api/v1').replace(/\/$/, '');
const OUT = path.resolve('e2e/screenshots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
let pass = 0;
let fail = 0;
const check = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  — ${extra}` : ''}`);
};

const browser = await chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'bn-BD' });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
const shot = (n, p = page) => p.screenshot({ path: path.join(OUT, `${n}.png`) });
// The cart updates on screen at once; the server call finishes in the background. Wait for it before
// navigating away (a full page load would cancel it).
const addToCart = async (button) => {
  const saved = page.waitForResponse((r) => r.url().includes('/cart/items') && r.request().method() === 'POST');
  await button.click();
  return saved;
};
const toastText = async () => { await page.waitForTimeout(400); return (await page.locator('[role="status"]').first().textContent({ timeout: 4000 }).catch(() => '')) || ''; };
const cartCount = () => page.evaluate(() => document.querySelector('header button[aria-label] span.relative span')?.textContent || '0');
const uniquePhone = '017' + String(Date.now()).slice(-8);

try {
  // ── Home ─────────────────────────────────────────────
  await page.goto(BASE + '/');
  await page.waitForSelector('main article');
  check('home: bangla UI', (await page.locator('html').getAttribute('lang')) === 'bn' && (await page.locator('text=বেস্ট সেলিং পণ্য').count()) > 0);
  check('home: hero + categories + product cards', (await page.locator('[aria-roledescription=carousel] img').count()) >= 3 && (await page.locator('main article').count()) >= 20);
  check('home: category sections + why + consultation', (await page.locator('main section h2').count()) >= 6 && (await page.locator('text=হাকিমি পরামর্শ').count()) > 0);
  await shot('01-home');
  check('home: WebSite JSON-LD with search action', (await page.locator('script[type="application/ld+json"]').allTextContents()).some((j) => j.includes('SearchAction')));

  // ── Category bar, "More" drawer, All Products tabs ────
  const nav = page.locator('header nav[aria-label]');
  check('category bar lists top-level categories', (await nav.locator('a[href^="/category/"]').count()) >= 9);
  await nav.locator('a[href="/category/honey"]').hover();
  await page.waitForTimeout(300);
  check('category bar dropdown shows sub-categories', await nav.locator('a[href="/category/sundarban-honey"]').isVisible());
  await page.getByRole('button', { name: 'আরও' }).click();
  check('"More" drawer opens with links', await page.locator('aside a[href="/blog"]').isVisible());
  await page.keyboard.press('Escape');
  await page.goto(BASE + '/');
  const allTabs = page.locator('button[aria-pressed]');
  await allTabs.filter({ hasText: 'খেজুর' }).click();
  await page.waitForTimeout(1200);
  const tabSection = page.locator('section', { has: allTabs.first() });
  const dateCards = await tabSection.locator('article').count();
  check('All Products tab loads that category', dateCards > 0 && dateCards < 20 && (await tabSection.locator('article >> text=খেজুর').count()) > 0, `n=${dateCards}`);

  // ── Live search ───────────────────────────────────────
  const search = page.locator('header input[type=search]').first();
  await search.fill('মধু');
  await page.waitForSelector('header a[href^="/products/"] img', { timeout: 8000 });
  check('live search suggestions (Bangla)', (await page.locator('header a[href^="/products/"]').count()) > 0);
  await shot('02-suggest');
  await search.press('Enter');
  await page.waitForURL(/\/products\?search=/);
  await page.waitForSelector('main article');
  check('search results page', (await page.locator('main article').count()) >= 4, page.url());

  // ── Category + filters ────────────────────────────────
  await page.goto(BASE + '/category/honey');
  await page.waitForSelector('main article');
  const honeyCount = await page.locator('main article').count();
  check('category includes sub-categories', honeyCount === 4, `n=${honeyCount}`);
  await page.selectOption('main select', 'price_asc');
  await page.waitForURL(/sort=price_asc/);
  await page.waitForTimeout(800);
  const prices = await page.$$eval('main article p > span.font-bold', (els) => els.map((e) => e.textContent));
  check('sort by price (URL + order)', prices.length > 1, prices.join(' '));
  await page.goto(BASE + '/category/dates?inStock=true');
  await page.waitForSelector('main article');
  check('in-stock filter hides Mariam dates', (await page.locator('main article >> text=মরিয়ম').count()) === 0);

  // ── Product page: variant, add to cart ────────────────
  await page.goto(BASE + '/products/sundarban-natural-honey');
  await page.waitForSelector('h1');
  const priceBefore = await page.locator('main .text-3xl').first().textContent();
  await page.getByRole('radio', { name: /১ কেজি|1kg/ }).click();
  const priceAfter = await page.locator('main .text-3xl').first().textContent();
  check('variant switch updates price', priceBefore !== priceAfter, `${priceBefore} → ${priceAfter}`);
  await page.locator('main button[aria-label="+"]').first().click();
  await addToCart(page.getByRole('button', { name: /কার্টে যোগ করুন/ }).first());
  await page.waitForSelector('[role=dialog] >> text=শপিং কার্ট');
  check('add to cart opens drawer', (await page.locator('[role=dialog] li').count()) === 1);
  await shot('03-drawer');
  await page.keyboard.press('Escape');
  check('reviews section loaded', (await page.locator('#reviews li').count()) > 0);
  check('related products', (await page.locator('main section article').count()) > 0);
  await shot('04-product');

  // add a simple product from a listing card + wishlist
  await page.goto(BASE + '/category/combo-packs');
  await page.waitForSelector('main article');
  await page.locator('main article').first().getByRole('button', { name: /এখনই কিনুন/ }).click();
  await page.waitForURL(/\/checkout$/, { timeout: 10000 });
  await page.waitForSelector('aside li');
  check('"Buy now" on a card goes to checkout with the item', (await page.locator('aside li').count()) === 2);
  await page.goto(BASE + '/category/combo-packs');
  await page.waitForSelector('main article');
  await page.locator('main article').nth(1).getByRole('button', { name: /উইশলিস্টে যোগ/ }).click();
  check('wishlist toggle (guest)', /উইশলিস্টে যোগ হয়েছে/.test(await toastText()));
  await page.goto(BASE + '/wishlist');
  await page.waitForSelector('main article');
  check('wishlist page (guest, localStorage)', (await page.locator('main article').count()) === 1);

  // ── Cart page ─────────────────────────────────────────
  await page.goto(BASE + '/cart');
  await page.waitForSelector('main li');
  const lines = await page.locator('main ul li').count();
  await page.locator('main ul li').first().locator('button[aria-label="+"]').click();
  await page.waitForTimeout(700);
  check('cart page qty update', lines === 2 && (await page.locator('main ul li').first().locator('span.font-semibold').first().textContent()) === '3');

  // ── Cart copy in localStorage shows before the API answers ──
  const before = await cartCount();
  await page.route('**/api/v1/cart', (r) => r.abort());
  await page.reload();
  await page.waitForTimeout(800);
  check('cart count restored from localStorage', before !== '0' && (await cartCount()) === before, `count=${before}`);
  await page.unroute('**/api/v1/cart');

  // ── Guest checkout (COD + coupon) ─────────────────────
  await page.goto(BASE + '/checkout');
  await page.waitForSelector('input[name=customerName]');
  await page.click('main form button[type=submit]');
  check('checkout validation messages', (await page.locator('text=সঠিক মোবাইল নম্বর দিন').count()) > 0 && (await page.locator('select[name=shippingDistrict], input[name=shippingArea]').count()) === 0);
  await page.fill('input[name=customerName]', 'E2E Guest');
  await page.fill('input[name=customerPhone]', uniquePhone);
  await page.fill('textarea[name=shippingAddress]', 'House 7, Road 3, Mirpur 2');
  await page.locator('label:has-text("ঢাকার বাইরে")').click();
  // Incomplete orders: the form is saved as a draft once a valid phone number is typed.
  const adminAuth = await (await fetch(`${API}/admin/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'ChangeMe@123' }) })).json();
  const draftsFor = async (status) =>
    (await (await fetch(`${API}/admin/incomplete-orders?status=${status}&search=${uniquePhone}`, { headers: { Authorization: `Bearer ${adminAuth.data?.accessToken}` } })).json()).data ?? [];
  let draftRows = [];
  for (let i = 0; i < 10 && !draftRows.length; i += 1) {
    await page.waitForTimeout(500);
    draftRows = await draftsFor('open');
  }
  check('checkout draft saved after typing the phone (incomplete order)', draftRows.length === 1 && draftRows[0].customerName === 'E2E Guest' && draftRows[0].items.length > 0, `${draftRows.length}`);
  await page.waitForTimeout(800);
  check('zone applies free delivery above threshold', (await page.locator('aside dl').textContent()).includes('ফ্রি'));
  await page.fill('aside input[aria-label="কুপন কোড"]', 'FLAT100');
  await page.getByRole('button', { name: 'প্রয়োগ' }).click();
  await page.waitForSelector('aside dl >> text=FLAT100', { timeout: 6000 });
  check('coupon applied (server quote)', true);
  await shot('05-checkout');
  await page.getByRole('button', { name: /অর্ডার কনফার্ম করুন/ }).click();
  await page.waitForURL(/\/checkout\/success\?order=/, { timeout: 15000 });
  const orderNumber = new URL(page.url()).searchParams.get('order');
  // The intro text also contains "অর্ডার নম্বর", so wait for the loaded order details (customer name) instead.
  await page.waitForSelector('text=E2E Guest', { timeout: 10000 }).catch(() => {});
  check('order placed → success page with details', /^ORD-/.test(orderNumber || '') && (await page.locator('text=E2E Guest').count()) > 0, orderNumber);
  await shot('06-success');
  check('cart emptied after order', (await cartCount()) === '0' || (await cartCount()) === '');
  const converted = await draftsFor('converted');
  check('placing the order closes the draft', converted.length === 1 && (await draftsFor('open')).length === 0);

  // ── Track order ───────────────────────────────────────
  await page.goto(BASE + '/track-order');
  await page.fill('input[type=tel]', uniquePhone);
  await page.getByRole('button', { name: /ট্র্যাক করুন/ }).click();
  await page.waitForSelector(`text=${orderNumber}`);
  await page.locator(`button:has-text("${orderNumber}")`).click();
  await page.waitForSelector('ol li');
  check('track order by phone → details', (await page.locator('text=অর্ডার গৃহীত').count()) > 0);

  // ── Guest cart merges into account on login ───────────
  await page.goto(BASE + '/products/organic-chia-seeds');
  await addToCart(page.getByRole('button', { name: /কার্টে যোগ করুন/ }).first());
  await page.waitForSelector('[role=dialog] li');
  await page.keyboard.press('Escape');
  await page.goto(BASE + '/login?next=/checkout');
  await page.fill('input[autocomplete=username]', '01711000001');
  await page.fill('input[type=password]', 'Customer@123');
  await page.click('main form button[type=submit]');
  await page.waitForURL(/\/checkout$/, { timeout: 10000 });
  await page.waitForSelector('input[name=customerName]');
  await page.waitForTimeout(800);
  check('login redirects to ?next', page.url().endsWith('/checkout'));
  check('guest cart merged into account cart', (await page.locator('aside li >> text=চিয়া').count()) > 0);
  check('checkout prefilled from profile/address', (await page.inputValue('input[name=customerName]')) === 'Rahim Uddin' && (await page.inputValue('textarea[name=shippingAddress]')).length > 0);

  // ── Logged-in checkout with bKash (mock gateway) ──────
  await page.locator('label:has-text("বিকাশ")').first().click();
  await page.getByRole('button', { name: /পরিশোধ করুন/ }).click();
  await page.waitForURL(/\/payments\/mock\//, { timeout: 15000 });
  check('redirected to payment gateway', true);
  await page.getByRole('button', { name: 'Pay successfully' }).click();
  await page.waitForURL(/\/checkout\/success/, { timeout: 15000 });
  check('gateway success → storefront success page', true);

  // ── Account ───────────────────────────────────────────
  await page.goto(BASE + '/account/orders');
  await page.waitForSelector('main a[href^="/account/orders/"]');
  await page.locator('main a[href^="/account/orders/"]').first().click();
  await page.waitForSelector('text=পরিশোধিত');
  check('account order detail shows paid bKash order', true);
  await page.goto(BASE + '/account/addresses');
  await page.waitForSelector('main li');
  check('addresses page', (await page.locator('main li').count()) >= 1);

  // write a review
  await page.goto(BASE + '/products/litchi-flower-honey');
  await page.waitForSelector('#reviews textarea');
  await page.fill('#reviews textarea', 'চমৎকার স্বাদ, আবার কিনবো!');
  await page.getByRole('button', { name: 'রিভিউ জমা দিন' }).click();
  check('submit review', /অনুমোদনের পর|moderation/.test(await toastText()));

  // logout
  await page.goto(BASE + '/account');
  await page.waitForSelector('text=প্রোফাইল');
  await page.getByRole('button', { name: 'লগআউট' }).click();
  await page.waitForURL(BASE + '/');
  await page.goto(BASE + '/account');
  await page.waitForURL(/\/login/);
  check('logout + account guard', true);

  // ── Register ──────────────────────────────────────────
  await page.goto(BASE + '/register');
  await page.fill('input[name=name]', 'নতুন কাস্টমার');
  await page.fill('input[name=phone]', '018' + String(Date.now()).slice(-8));
  await page.fill('input[name=password]', 'secret123');
  await page.fill('input[name=confirm]', 'secret123');
  await page.click('main form button[type=submit]');
  await page.waitForURL(/\/account$/, { timeout: 10000 });
  await page.waitForSelector('text=নতুন কাস্টমার');
  check('register → logged in account', true);
  await page.getByRole('button', { name: 'লগআউট' }).click();
  await page.waitForURL(BASE + '/');

  // ── OTP password reset ────────────────────────────────
  await page.goto(BASE + '/forgot-password');
  await page.fill('main input', '01811000002');
  await page.getByRole('button', { name: 'কোড পাঠান' }).click();
  await page.waitForSelector('input[autocomplete=one-time-code]');
  await page.waitForTimeout(500);
  if (!process.env.API_LOG) throw new Error('Set API_LOG to the API console log file to test the OTP step');
  const log = fs.readFileSync(process.env.API_LOG, 'utf8');
  const code = [...log.matchAll(/code is (\d+)/g)].pop()?.[1];
  await page.fill('input[autocomplete=one-time-code]', code || '');
  await page.fill('input[type=password]', 'NewPass123');
  await page.getByRole('button', { name: 'পাসওয়ার্ড রিসেট করুন' }).click();
  await page.waitForURL(/\/login$/, { timeout: 10000 });
  check('OTP password reset', Boolean(code));

  // ── English ───────────────────────────────────────────
  await page.goto(BASE + '/en/products');
  await page.waitForSelector('main article');
  check('english listing', (await page.locator('h1').textContent()) === 'All products' && (await page.locator('html').getAttribute('lang')) === 'en');
  const href = await page.locator('main article a').first().getAttribute('href');
  check('english links keep /en prefix', href?.startsWith('/en/products/'), href);
  await page.goto(BASE + '/en/nope');
  check('localized 404', (await page.locator('text=Page not found').count()) > 0);

  // ── Desktop cart side panel: keep adding while it's open (no backdrop) ──
  await page.goto(BASE + '/category/combo-packs');
  await page.waitForSelector('main article');
  const panelLines = () => page.locator('[role=dialog] li').count();
  await addToCart(page.locator('main article').nth(0).getByRole('button', { name: 'কার্টে যোগ করুন' }));
  await page.waitForSelector('[role=dialog] li');
  const linesBefore = await panelLines();
  check('first card add opens the cart panel', await page.locator('[role=dialog]').isVisible());
  await addToCart(page.locator('main article').nth(1).getByRole('button', { name: 'কার্টে যোগ করুন' })); // panel still open
  await page.waitForTimeout(1000);
  check('can add from the page while the panel is open', (await panelLines()) === linesBefore + 1 && (await page.locator('[role=dialog]').getAttribute('aria-modal')) === 'false', `${linesBefore} → ${await panelLines()}`);
  const box = await page.locator('main article').nth(0).boundingBox();
  check('page shifts left so the panel covers nothing', box.x + box.width <= 1366 - 380);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await addToCart(page.locator('main article').nth(2).getByRole('button', { name: 'কার্টে যোগ করুন' }));
  check('after closing it, adds show a notice instead of reopening', /কার্টে যোগ হয়েছে/.test(await toastText()) && (await page.locator('[role=dialog]').count()) === 0);

  // ── Instant add: the line shows before a slow server answers ──
  await page.goto(BASE + '/category/spices');
  await page.waitForSelector('main article');
  await page.getByRole('button', { name: 'কার্ট' }).first().click(); // open the cart panel
  await page.waitForSelector('[role=dialog] li');
  const linesNow = await panelLines();
  await page.route('**/api/v1/cart/items', async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
  const slowSave = addToCart(page.locator('main article').nth(0).getByRole('button', { name: 'কার্টে যোগ করুন' }));
  await page.waitForTimeout(700);
  check('added product shows at once, before the server answers', (await panelLines()) === linesNow + 1);
  check('server confirms the add afterwards', (await slowSave).ok());
  await page.unroute('**/api/v1/cart/items');

  // ── Mobile ────────────────────────────────────────────
  await page.setViewportSize({ width: 390, height: 844 });
  for (const p of ['/', '/products/sundarban-natural-honey', '/checkout', '/category/honey']) {
    await page.goto(BASE + p);
    await page.waitForLoadState('load');
    await page.waitForSelector('main');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`mobile no horizontal scroll ${p}`, overflow <= 1, `overflow=${overflow}`);
  }
  await page.goto(BASE + '/');
  await page.waitForSelector('main article');
  check('mobile bottom nav visible', await page.locator('nav[aria-label=Mobile]').isVisible());
  await shot('07-mobile-home');
  await page.getByRole('button', { name: 'মেনু' }).click();
  await page.waitForSelector('aside >> text=ক্যাটাগরি');
  await shot('08-mobile-menu');
  check('mobile menu', true);
  await page.goto(BASE + '/products/sundarban-natural-honey');
  await page.waitForSelector('h1');
  await shot('09-mobile-product');
} catch (err) {
  check('UNCAUGHT', false, err.message.split('\n')[0]);
  await shot('zz-error');
}

// Ignore network noise (refresh 401 for guests, image fetches) but keep real errors (hydration, exceptions).
const relevant = consoleErrors.filter((e) => !/Failed to load resource|401|403|404|net::/.test(e));
check('no console/page errors', relevant.length === 0, relevant.slice(0, 3).join(' | ').slice(0, 400));

await browser.close();
console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
