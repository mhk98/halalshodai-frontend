'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { api, ApiError } from '@/lib/api-client';
import { ln } from '@/lib/routes';
import { Button, Field, Input, PageSpinner, Select, Textarea } from '@/components/ui';
import type { Address, DeliveryZone } from '@/types';
import { DISTRICTS } from '@/lib/districts';

type Form = { label: string; fullName: string; phone: string; addressLine: string; area: string; district: string; deliveryZoneId: string; isDefault: boolean };
const empty: Form = { label: 'Home', fullName: '', phone: '', addressLine: '', area: '', district: '', deliveryZoneId: '', isDefault: false };

export default function AddressesPage() {
  const { t, lang } = useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: async () => (await api<Address[]>('/account/addresses')).data });
  const zones = useQuery({ queryKey: ['zones'], queryFn: async () => (await api<DeliveryZone[]>('/delivery-zones')).data, staleTime: 300_000 });
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>({ defaultValues: empty });

  const open = (a: Address | 'new') => {
    setEditing(a);
    reset(a === 'new' ? empty : { label: a.label ?? '', fullName: a.fullName, phone: a.phone, addressLine: a.addressLine, area: a.area ?? '', district: a.district || DISTRICTS.find((x) => x.en.toLowerCase() === a.city?.trim().toLowerCase())?.en || '', deliveryZoneId: a.deliveryZoneId ? String(a.deliveryZoneId) : '', isDefault: a.isDefault });
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ['addresses'] });

  const onSubmit = async (d: Form) => {
    const body = { ...d, deliveryZoneId: d.deliveryZoneId ? Number(d.deliveryZoneId) : null, area: d.area || null, district: d.district || null, label: d.label || null };
    try {
      if (editing === 'new') await api('/account/addresses', { method: 'POST', body });
      else if (editing) await api(`/account/addresses/${editing.id}`, { method: 'PUT', body });
      toast.success(t('common.saved'));
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error((err as ApiError).errors?.[0]?.message || (err as Error).message);
    }
  };

  const remove = async (a: Address) => {
    if (!window.confirm(t('account.deleteAddress'))) return;
    try {
      await api(`/account/addresses/${a.id}`, { method: 'DELETE' });
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (addresses.isLoading) return <PageSpinner />;

  return (
    <section className="rounded-xl bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('account.addresses')}</h1>
        {!editing && <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => open('new')}>{t('account.addAddress')}</Button>}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Field label={t('checkout.name')} required><Input {...register('fullName', { required: true })} /></Field>
          <Field label={t('checkout.phone')} required><Input type="tel" {...register('phone', { required: true })} /></Field>
          <Field label={t('checkout.address')} required className="sm:col-span-2"><Textarea rows={2} {...register('addressLine', { required: true })} /></Field>
          <Field label={t('checkout.district')}>
            <Select {...register('district')}>
              <option value="">{t('checkout.selectDistrict')}</option>
              {DISTRICTS.map((d) => <option key={d.en} value={d.en}>{lang === 'bn' ? `${d.bn} (${d.en})` : d.en}</option>)}
            </Select>
          </Field>
          <Field label={t('checkout.area')}><Input {...register('area')} /></Field>
          <Field label={t('checkout.deliveryArea')}>
            <Select {...register('deliveryZoneId')}>
              <option value="">—</option>
              {zones.data?.map((z) => <option key={z.id} value={z.id}>{ln(lang, z.name, z.nameBn)}</option>)}
            </Select>
          </Field>
          <Field label={t('account.label')}><Input {...register('label')} placeholder={t('account.labelPlaceholder')} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" {...register('isDefault')} className="h-4 w-4 rounded text-brand-600" />{t('account.makeDefault')}</label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" loading={isSubmitting}>{t('common.save')}</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          </div>
        </form>
      ) : addresses.data?.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.data.map((a) => (
            <li key={a.id} className="rounded-lg border border-gray-200 p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 font-semibold"><MapPin className="h-4 w-4 text-brand-600" />{a.label || t('account.address')}{a.isDefault && <span className="rounded bg-brand-100 px-1.5 text-xs font-medium text-brand-800">{t('account.default')}</span>}</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => open(a)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(a)} className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-2">{a.fullName} · {a.phone}</p>
              <p className="text-gray-600">{[a.addressLine, a.area, a.city, a.district].filter(Boolean).join(', ')}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-gray-500">{t('account.noAddresses')}</p>
      )}
    </section>
  );
}
