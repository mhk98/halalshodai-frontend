'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Lock, Tag, Truck, ShoppingBag } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { api, ApiError, cartSession } from '@/lib/api-client';
import { track, trackingContext } from '@/lib/analytics';
import { cancelDraftSave, clearDraftId, draftId, saveDraftSoon } from '@/lib/checkoutDraft';
import { ln } from '@/lib/routes';
import { BD_PHONE, money } from '@/lib/format';
import { Button, Field, Input, PageSpinner, Textarea } from '@/components/ui';
import type { Address, DeliveryZone, PaymentMethod, Quote } from '@/types';

export default function CheckoutPage() {
  const { t, lang, href, settings } = useApp();
  const router = useRouter();
  const { cart, loaded } = useCartStore();
  const resetCart = useCartStore((s) => s.reset);
  const { user, status } = useAuthStore();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [placing, setPlacing] = useState(false);
  const trackedRef = useRef(false);

  const schema = z.object({
    customerName: z.string().trim().min(2, t('validation.name')),
    customerPhone: z.string().trim().refine((v) => BD_PHONE.test(v.replace(/[\s-]/g, '')), t('validation.phone')),
    customerEmail: z.string().trim().email(t('validation.email')).or(z.literal('')),
    shippingAddress: z.string().trim().min(5, t('validation.address')),
    deliveryZoneId: z.string().min(1, t('validation.zone')),
    paymentMethod: z.enum(['cod', 'bkash', 'sslcommerz']),
    customerNote: z.string().max(1000),
    saveAddress: z.boolean(),
  });
  type Form = z.infer<typeof schema>;

  const methods = useMemo(
    () => (['cod', 'bkash', 'sslcommerz'] as PaymentMethod[]).filter((m) => settings[`${m}_enabled`] !== false),
    [settings],
  );

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: '', customerPhone: '', customerEmail: '', shippingAddress: '',
      deliveryZoneId: '', paymentMethod: methods[0] ?? 'cod', customerNote: '', saveAddress: true,
    },
  });

  // Checkout can't continue without zones: keep retrying (e.g. while the API restarts) and reload on tab focus.
  const zones = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await api<DeliveryZone[]>('/delivery-zones')).data,
    staleTime: 300_000,
    retry: 4,
    retryDelay: (n) => Math.min(1000 * 2 ** n, 8000),
    refetchOnWindowFocus: true,
  });
  const addresses = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => (await api<Address[]>('/account/addresses')).data,
    enabled: status === 'authenticated',
  });

  // Prefill from the customer's profile + default address.
  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    const a = addresses.data?.find((x) => x.isDefault) ?? addresses.data?.[0];
    reset((v) => ({
      ...v,
      customerName: v.customerName || a?.fullName || user.name,
      customerPhone: v.customerPhone || a?.phone || user.phone || '',
      customerEmail: v.customerEmail || user.email || '',
      shippingAddress: v.shippingAddress || a?.addressLine || '',
      deliveryZoneId: v.deliveryZoneId || (a?.deliveryZoneId ? String(a.deliveryZoneId) : ''),
    }));
  }, [status, user, addresses.data, reset]);

  const zoneId = watch('deliveryZoneId');
  const payment = watch('paymentMethod');
  const items = useMemo(() => cart.items.filter((l) => !l.issue).map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })), [cart.items]);

  // Incomplete orders: save the form once a valid mobile number is typed (debounced).
  const draftFields = watch(['customerPhone', 'customerName', 'customerEmail', 'shippingAddress', 'deliveryZoneId']);
  const [dPhone, dName, dEmail, dAddress, dZone] = draftFields;
  useEffect(() => {
    if (placing) return;
    saveDraftSoon({
      phone: dPhone || '',
      name: dName?.trim() || undefined,
      email: dEmail?.trim() || undefined,
      address: dAddress?.trim() || undefined,
      deliveryZoneId: dZone ? Number(dZone) : null,
      items,
    });
  }, [dPhone, dName, dEmail, dAddress, dZone, items, placing]);

  const quote = useQuery({
    queryKey: ['quote', items, zoneId, appliedCoupon],
    queryFn: async () => (await api<Quote>('/checkout/quote', { method: 'POST', body: { items, deliveryZoneId: zoneId ? Number(zoneId) : undefined, couponCode: appliedCoupon } })).data,
    enabled: items.length > 0,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (quote.data?.couponError && appliedCoupon) {
      toast.error(quote.data.couponError);
      setAppliedCoupon(undefined);
    } else if (quote.data?.coupon && appliedCoupon) {
      toast.success(t('checkout.couponApplied'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote.data?.couponError, quote.data?.coupon?.code]);

  useEffect(() => {
    if (!trackedRef.current && cart.items.length && quote.data) {
      trackedRef.current = true;
      track.beginCheckout(cart.items.map((l) => ({ id: l.productId, name: l.name, price: l.unitPrice, quantity: l.quantity })), quote.data.total);
    }
  }, [cart.items, quote.data]);

  const guestBlocked = status === 'guest' && settings.guest_checkout_enabled === false;
  useEffect(() => {
    if (guestBlocked) router.replace(href('/login?next=/checkout'));
  }, [guestBlocked, router, href]);

  if (!loaded || status === 'loading') return <PageSpinner />;

  if (!cart.items.length) {
    return (
      <div className="container flex flex-col items-center py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300" />
        <p className="mt-4 text-lg">{t('cart.empty')}</p>
        <Link href={href('/products')} className="mt-6 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white">{t('cart.startShopping')}</Link>
      </div>
    );
  }

  if (guestBlocked) return <PageSpinner />;

  const onSubmit = async (d: Form) => {
    setPlacing(true);
    cancelDraftSave(); // the order itself closes the draft
    const lineItems = cart.items.map((l) => ({ id: l.productId, name: l.name, price: l.unitPrice, quantity: l.quantity }));
    track.addPaymentInfo(lineItems, quote.data?.total ?? cart.subtotal, d.paymentMethod, {
      phone: d.customerPhone, email: d.customerEmail || undefined, name: d.customerName,
    });
    try {
      const { data } = await api<{ orderNumber: string; total: number; payment: { redirectUrl: string | null } }>('/orders', {
        method: 'POST',
        body: {
          ...d,
          customerEmail: d.customerEmail || undefined,
          customerNote: d.customerNote || undefined,
          deliveryZoneId: Number(d.deliveryZoneId),
          couponCode: appliedCoupon,
          items,
          saveAddress: status === 'authenticated' ? d.saveAddress : undefined,
          tracking: trackingContext(), // lets the server-side Meta Purchase match this visitor
          draftId: draftId(), // closes this checkout's incomplete-order draft
        },
      });
      // COD is a purchase now; online payments count on the success page once paid (and on the server).
      if (d.paymentMethod === 'cod') track.purchase(data.orderNumber, lineItems, data.total);
      // Phone is needed to show the order on the success / tracking page.
      clearDraftId();
      sessionStorage.setItem(`order:${data.orderNumber}`, d.customerPhone);
      resetCart();
      if (status !== 'authenticated') cartSession.set(null);
      if (data.payment.redirectUrl) window.location.href = data.payment.redirectUrl;
      else if (d.paymentMethod !== 'cod') router.replace(href(`/checkout/failed?order=${encodeURIComponent(data.orderNumber)}`)); // gateway unavailable; order kept
      else router.replace(href(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`));
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.errors?.[0]?.message || e.message);
      setPlacing(false);
      useCartStore.getState().load();
    }
  };

  const q = quote.data;
  const zoneList = zones.data ?? [];

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('checkout.title')}</h1>
      {status === 'guest' && (
        <p className="mb-5 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
          {t('checkout.guestNote')} <Link href={href('/login?next=/checkout')} className="font-semibold underline">{t('auth.login')}</Link>
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit, () => toast.error(t('validation.fixErrors')))} className="grid gap-6 lg:grid-cols-3" noValidate>
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-semibold">{t('checkout.shippingInfo')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('checkout.name')} required error={errors.customerName?.message}><Input autoComplete="name" {...register('customerName')} invalid={!!errors.customerName} /></Field>
              <Field label={t('checkout.phone')} required error={errors.customerPhone?.message}><Input type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" {...register('customerPhone')} invalid={!!errors.customerPhone} /></Field>
              <Field label={t('checkout.address')} required error={errors.shippingAddress?.message} className="sm:col-span-2">
                <Textarea rows={2} autoComplete="street-address" placeholder={t('checkout.addressPlaceholder')} {...register('shippingAddress')} invalid={!!errors.shippingAddress} />
              </Field>
              <Field label={t('checkout.email')} error={errors.customerEmail?.message} className="sm:col-span-2"><Input type="email" autoComplete="email" {...register('customerEmail')} /></Field>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" />{t('checkout.deliveryArea')}</h2>
            {errors.deliveryZoneId && zoneList.length > 0 && <p className="mb-2 text-sm text-red-600">{errors.deliveryZoneId.message}</p>}
            {zones.isPending && (
              <div className="grid gap-3 sm:grid-cols-3" aria-busy="true">
                {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />)}
              </div>
            )}
            {(zones.isError || (zones.isSuccess && zoneList.length === 0)) && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                <span className="flex-1">
                  {zones.isError ? t('checkout.zonesError') : t('checkout.zonesEmpty')}
                  {zones.error instanceof ApiError && <span className="block text-xs opacity-75">{zones.error.message}</span>}
                </span>
                <Button type="button" size="sm" variant="outline" loading={zones.isFetching} onClick={() => zones.refetch()}>{t('checkout.retry')}</Button>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              {zoneList.map((z) => (
                <label key={z.id} className={clsx('cursor-pointer rounded-lg border p-3 transition', zoneId === String(z.id) ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-gray-200 hover:border-brand-300')}>
                  <input type="radio" value={z.id} {...register('deliveryZoneId')} className="sr-only" />
                  <span className="block text-sm font-semibold text-gray-800">{ln(lang, z.name, z.nameBn)}</span>
                  <span className="block text-sm text-brand-700">{money(z.charge, lang)}</span>
                  {z.estimatedDays && <span className="block text-xs text-gray-500">{z.estimatedDays}</span>}
                  {z.freeDeliveryThreshold && <span className="mt-1 block text-xs text-earth-700">{t('checkout.freeAbove', { amount: money(z.freeDeliveryThreshold, lang) })}</span>}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-semibold">{t('checkout.payment')}</h2>
            <div className="space-y-3">
              {methods.map((m) => (
                <label key={m} className={clsx('flex cursor-pointer items-center gap-3 rounded-lg border p-3', payment === m ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-gray-200')}>
                  <input type="radio" value={m} {...register('paymentMethod')} className="h-4 w-4 text-brand-600 focus:ring-brand-500" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-gray-800">{t(`payment.${m}`)}</span>
                    <span className="block text-xs text-gray-500">{t(`payment.${m}Hint`)}</span>
                  </span>
                  {m === 'bkash' && <span className="rounded bg-[#e2136e] px-2 py-0.5 text-xs font-bold text-white">bKash</span>}
                </label>
              ))}
            </div>
            <Field label={t('checkout.note')} className="mt-4"><Textarea rows={2} {...register('customerNote')} placeholder={t('checkout.notePlaceholder')} /></Field>
            {status === 'authenticated' && (
              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" {...register('saveAddress')} className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500" /> {t('checkout.saveAddress')}
              </label>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-xl bg-white p-5 shadow-card lg:sticky lg:top-36">
          <h2 className="font-semibold">{t('checkout.summary')}</h2>
          <ul className="max-h-64 space-y-3 overflow-y-auto">
            {cart.items.filter((l) => !l.issue).map((l) => (
              <li key={l.id} className="flex items-center gap-3 text-sm">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-gray-50">
                  {l.image && <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />}
                  <span className="absolute -right-0 -top-0 rounded-bl bg-gray-700 px-1 text-[10px] text-white">{l.quantity}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1">{ln(lang, l.name, l.nameBn)}</span>
                  {l.variantName && <span className="text-xs text-gray-500">{ln(lang, l.variantName, l.variantNameBn)}</span>}
                </span>
                <span className="font-medium">{money(l.lineTotal, lang)}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder={t('checkout.couponPlaceholder')} className="pl-9" aria-label={t('checkout.couponPlaceholder')} />
            </div>
            {appliedCoupon ? (
              <Button variant="ghost" onClick={() => { setAppliedCoupon(undefined); setCoupon(''); }}>{t('checkout.removeCoupon')}</Button>
            ) : (
              <Button variant="secondary" disabled={!coupon.trim()} loading={quote.isFetching && !!coupon && !appliedCoupon} onClick={() => setAppliedCoupon(coupon.trim())}>
                {t('checkout.apply')}
              </Button>
            )}
          </div>

          <dl className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">{t('cart.subtotal')}</dt><dd>{money(q?.subtotal ?? cart.subtotal, lang)}</dd></div>
            {q && q.discount > 0 && (
              <div className="flex justify-between text-brand-700"><dt>{t('checkout.discount')} ({q.coupon?.code})</dt><dd>−{money(q.discount, lang)}</dd></div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-600">{t('checkout.delivery')}</dt>
              <dd>{zoneId ? (q?.deliveryCharge === 0 ? <span className="font-medium text-brand-700">{t('checkout.free')}</span> : money(q?.deliveryCharge, lang)) : <span className="text-gray-400">{t('checkout.selectArea')}</span>}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>{t('checkout.total')}</dt><dd>{money(q?.total ?? cart.subtotal, lang)}</dd></div>
          </dl>

          <Button type="submit" size="lg" block loading={placing} icon={<Lock className="h-4 w-4" />}>
            {payment === 'cod' ? t('checkout.placeOrder') : t('checkout.payNow', { amount: money(q?.total ?? 0, lang) })}
          </Button>
          <p className="text-center text-xs text-gray-500">{t('checkout.terms')}</p>
        </aside>
      </form>
    </div>
  );
}
