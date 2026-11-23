'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Check, Minus, Plus, ShoppingBag, Truck } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useAuthStore } from '@/store/auth';
import { api, ApiError } from '@/lib/api-client';
import { track, trackingContext } from '@/lib/analytics';
import { cancelDraftSave, clearDraftId, draftId, saveDraftSoon } from '@/lib/checkoutDraft';
import { ln } from '@/lib/routes';
import { BD_PHONE, money } from '@/lib/format';
import { Button, Field, Input, Textarea } from '@/components/ui';
import type { DeliveryZone, LandingOptions, LandingProduct, PaymentMethod, Quote } from '@/types';

interface Line {
  key: string;
  productId: number;
  variantId: number | null;
  quantity: number;
  selected: boolean;
}

const unitPrice = (lp: LandingProduct, variantId: number | null) =>
  lp.product.variants.find((v) => v.id === variantId)?.price ?? lp.product.price;

export default function LandingOrderForm({ pageId, products, options }: { pageId: number; products: LandingProduct[]; options: LandingOptions }) {
  const { t, lang, href, settings } = useApp();
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const multi = !!options.multiSelect;

  const [lines, setLines] = useState<Line[]>(() =>
    products.map((p, i) => ({
      key: `${p.productId}-${p.variantId ?? 0}-${i}`,
      productId: p.productId,
      variantId: p.variantId ?? (p.product.hasVariants ? (p.product.variants.find((v) => v.isDefault) ?? p.product.variants[0])?.id ?? null : null),
      quantity: p.quantity || 1,
      selected: i === 0,
    })),
  );
  const [form, setForm] = useState({ name: '', phone: '', address: '', zone: '', note: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [placing, setPlacing] = useState(false);
  const checkoutTracked = useRef(false);

  const methods = useMemo(
    () => (['cod', 'bkash', 'sslcommerz'] as PaymentMethod[]).filter((m) => settings[`${m}_enabled`] !== false),
    [settings],
  );
  const [payment, setPayment] = useState<PaymentMethod>(methods[0] ?? 'cod');

  const zones = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await api<DeliveryZone[]>('/delivery-zones')).data,
    staleTime: 300_000,
    retry: 4,
  });

  const items = useMemo(
    () => lines.filter((l) => l.selected).map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
    [lines],
  );

  const quote = useQuery({
    queryKey: ['quote', 'landing', items, form.zone],
    queryFn: async () => (await api<Quote>('/checkout/quote', { method: 'POST', body: { items, deliveryZoneId: form.zone ? Number(form.zone) : undefined } })).data,
    enabled: items.length > 0,
    placeholderData: (prev) => prev,
  });

  // Incomplete orders: save the form once a valid mobile number is typed (same as the checkout page).
  useEffect(() => {
    if (placing) return;
    saveDraftSoon({
      phone: form.phone,
      name: form.name.trim() || undefined,
      address: form.address.trim() || undefined,
      deliveryZoneId: form.zone ? Number(form.zone) : null,
      items,
    });
    if (!checkoutTracked.current && BD_PHONE.test(form.phone.replace(/[\s-]/g, '')) && items.length) {
      checkoutTracked.current = true;
      track.beginCheckout(trackItems(), quote.data?.total ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.phone, form.name, form.address, form.zone, items, placing]);

  const byIndex = (i: number) => products[i];
  const trackItems = () =>
    lines
      .map((l, i) => ({ l, p: byIndex(i) }))
      .filter(({ l }) => l.selected)
      .map(({ l, p }) => ({ id: l.productId, name: p.product.name, price: unitPrice(p, l.variantId), quantity: l.quantity }));

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const choose = (i: number) => setLines((ls) => ls.map((l, j) => (multi ? (j === i ? { ...l, selected: !l.selected } : l) : { ...l, selected: j === i })));
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const guestBlocked = status === 'guest' && settings.guest_checkout_enabled === false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (form.name.trim().length < 2) errs.name = t('validation.name');
    if (!BD_PHONE.test(form.phone.replace(/[\s-]/g, ''))) errs.phone = t('validation.phone');
    if (form.address.trim().length < 5) errs.address = t('validation.address');
    if (!form.zone) errs.zone = t('validation.zone');
    setErrors(errs);
    if (!items.length) return toast.error(t('landing.chooseProduct'));
    if (Object.keys(errs).length) return toast.error(t('validation.fixErrors'));

    setPlacing(true);
    cancelDraftSave();
    const tItems = trackItems();
    track.addPaymentInfo(tItems, quote.data?.total ?? 0, payment, { phone: form.phone, name: form.name });
    try {
      const { data } = await api<{ orderNumber: string; total: number; payment: { redirectUrl: string | null } }>('/orders', {
        method: 'POST',
        body: {
          items,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          shippingAddress: form.address.trim(),
          deliveryZoneId: Number(form.zone),
          paymentMethod: payment,
          customerNote: form.note.trim() || undefined,
          landingPageId: pageId,
          tracking: trackingContext(),
          draftId: draftId(),
        },
      });
      if (payment === 'cod') track.purchase(data.orderNumber, tItems, data.total);
      clearDraftId();
      sessionStorage.setItem(`order:${data.orderNumber}`, form.phone.trim());
      if (data.payment.redirectUrl) window.location.href = data.payment.redirectUrl;
      else if (payment !== 'cod') router.push(href(`/checkout/failed?order=${encodeURIComponent(data.orderNumber)}`));
      else router.push(href(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`));
    } catch (err) {
      const e2 = err as ApiError;
      toast.error(e2.errors?.[0]?.message || e2.message);
      setPlacing(false);
    }
  }

  const q = quote.data;
  const zoneList = zones.data ?? [];

  if (!products.length) {
    return <p className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-card">{t('landing.unavailable')}</p>;
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-5xl gap-6 rounded-2xl bg-white p-4 shadow-card sm:p-6 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        {/* Products */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><ShoppingBag className="h-4 w-4" /> {multi ? t('landing.pickProducts') : t('landing.pickProduct')}</h3>
          <ul className="space-y-3">
            {products.map((p, i) => {
              const l = lines[i];
              const price = unitPrice(p, l.variantId);
              const variant = p.product.variants.find((v) => v.id === l.variantId);
              const stock = variant ? variant.stock : p.product.stock;
              const out = stock <= 0;
              return (
                <li key={l.key}>
                  <div
                    role={multi ? 'checkbox' : 'radio'}
                    aria-checked={l.selected}
                    tabIndex={0}
                    onClick={() => !out && choose(i)}
                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !out && (e.preventDefault(), choose(i))}
                    className={clsx(
                      'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition',
                      l.selected ? 'border-[var(--lp)] bg-[color-mix(in_srgb,var(--lp)_6%,white)]' : 'border-gray-200 hover:border-gray-300',
                      out && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center border-2', multi ? 'rounded' : 'rounded-full', l.selected ? 'border-[var(--lp)] bg-[var(--lp)] text-white' : 'border-gray-300')}>
                      {l.selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                      {p.product.image && <Image src={p.product.image} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{ln(lang, p.product.name, p.product.nameBn)}</span>
                      <span className="mt-0.5 flex items-baseline gap-2 text-sm">
                        <span className="font-bold text-[var(--lp)]">{money(price, lang)}</span>
                        {(variant?.regularPrice ?? p.product.regularPrice) > price && (
                          <del className="text-xs text-gray-400">{money(variant?.regularPrice ?? p.product.regularPrice, lang)}</del>
                        )}
                      </span>
                      {out && <span className="text-xs text-red-600">{t('landing.outOfStock')}</span>}
                    </span>
                  </div>
                  {l.selected && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 pl-8">
                      {p.product.hasVariants && p.product.variants.length > 1 && (
                        <select
                          value={l.variantId ?? ''}
                          onChange={(e) => setLine(i, { variantId: Number(e.target.value) })}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                          aria-label={t('landing.variant')}
                        >
                          {p.product.variants.map((v) => (
                            <option key={v.id} value={v.id} disabled={v.stock <= 0}>{ln(lang, v.name, v.nameBn)} — {money(v.price, lang)}</option>
                          ))}
                        </select>
                      )}
                      <div className="inline-flex items-center rounded-lg border border-gray-300">
                        <button type="button" onClick={() => setLine(i, { quantity: Math.max(1, l.quantity - 1) })} className="p-2 text-gray-600 hover:bg-gray-50" aria-label="−"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                        <button type="button" onClick={() => setLine(i, { quantity: Math.min(100, stock > 0 ? stock : 100, l.quantity + 1) })} className="p-2 text-gray-600 hover:bg-gray-50" aria-label="+"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Customer */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label={t('checkout.name')} required error={errors.name}>
            <Input autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} invalid={!!errors.name} />
          </Field>
          <Field label={t('checkout.phone')} required error={errors.phone}>
            <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => set('phone', e.target.value)} invalid={!!errors.phone} />
          </Field>
          <Field label={t('checkout.address')} required error={errors.address} className="sm:col-span-2">
            <Textarea rows={2} autoComplete="street-address" placeholder={t('checkout.addressPlaceholder')} value={form.address} onChange={(e) => set('address', e.target.value)} invalid={!!errors.address} />
          </Field>
        </section>

        {/* Delivery area */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> {t('checkout.deliveryArea')}</h3>
          {errors.zone && <p className="mb-2 text-sm text-red-600">{errors.zone}</p>}
          {zones.isPending && <div className="h-16 animate-pulse rounded-lg bg-gray-100" />}
          {zones.isError && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {t('checkout.zonesError')} <button type="button" className="font-semibold underline" onClick={() => zones.refetch()}>{t('checkout.retry')}</button>
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {zoneList.map((z) => (
              <label key={z.id} className={clsx('cursor-pointer rounded-lg border p-3 transition', form.zone === String(z.id) ? 'border-[var(--lp)] ring-1 ring-[var(--lp)]' : 'border-gray-200 hover:border-gray-300')}>
                <input type="radio" name="zone" value={z.id} checked={form.zone === String(z.id)} onChange={() => set('zone', String(z.id))} className="sr-only" />
                <span className="block text-sm font-semibold text-gray-800">{ln(lang, z.name, z.nameBn)}</span>
                <span className="block text-sm text-gray-600">{money(z.charge, lang)}</span>
              </label>
            ))}
          </div>
        </section>

        {methods.length > 1 && (
          <section>
            <h3 className="mb-3 font-semibold">{t('checkout.payment')}</h3>
            <div className="space-y-2">
              {methods.map((m) => (
                <label key={m} className={clsx('flex cursor-pointer items-center gap-3 rounded-lg border p-3', payment === m ? 'border-[var(--lp)] ring-1 ring-[var(--lp)]' : 'border-gray-200')}>
                  <input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} className="h-4 w-4 accent-[var(--lp)]" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-gray-800">{t(`payment.${m}`)}</span>
                    <span className="block text-xs text-gray-500">{t(`payment.${m}Hint`)}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        <Field label={t('checkout.note')}>
          <Textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder={t('checkout.notePlaceholder')} />
        </Field>
      </div>

      {/* Summary */}
      <aside className="h-fit space-y-4 rounded-xl bg-gray-50 p-4 lg:sticky lg:top-6 lg:col-span-2">
        <h3 className="font-semibold">{t('checkout.summary')}</h3>
        <ul className="space-y-2 text-sm">
          {(q?.lines ?? []).map((l) => (
            <li key={`${l.productId}-${l.variantId}`} className="flex justify-between gap-3">
              <span className="min-w-0 flex-1">{l.productName}{l.variantName ? ` (${l.variantName})` : ''} × {l.quantity}</span>
              <span className="font-medium">{money(l.total, lang)}</span>
            </li>
          ))}
          {!items.length && <li className="text-gray-500">{t('landing.chooseProduct')}</li>}
        </ul>
        <dl className="space-y-2 border-t pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">{t('cart.subtotal')}</dt><dd>{money(q?.subtotal ?? 0, lang)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-gray-600">{t('checkout.delivery')}</dt>
            <dd>{form.zone ? (q?.deliveryCharge === 0 ? t('checkout.free') : money(q?.deliveryCharge, lang)) : <span className="text-gray-400">{t('checkout.selectArea')}</span>}</dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>{t('checkout.total')}</dt><dd>{money(q?.total ?? 0, lang)}</dd></div>
        </dl>
        {guestBlocked ? (
          <a href={href(`/login?next=${encodeURIComponent(typeof window === 'undefined' ? '/' : window.location.pathname)}`)} className="block rounded-lg bg-[var(--lp)] px-4 py-3 text-center font-semibold text-white">
            {t('auth.login')}
          </a>
        ) : (
          <Button type="submit" size="lg" block loading={placing} disabled={!items.length} className="!bg-[var(--lp)] hover:!brightness-110">
            {payment === 'cod' ? options.orderButtonText || t('checkout.placeOrder') : t('checkout.payNow', { amount: money(q?.total ?? 0, lang) })}
          </Button>
        )}
        <p className="text-center text-xs text-gray-500">{t('checkout.terms')}</p>
      </aside>
    </form>
  );
}
