'use client';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useApp } from '@/components/providers/Providers';
import { useAuthStore } from '@/store/auth';
import { useAuthActions } from '@/hooks/useAuthActions';
import { api, ApiError } from '@/lib/api-client';
import { Button, Field, Input, Select } from '@/components/ui';
import type { User } from '@/types';

interface ProfileForm { name: string; phone: string; email: string; gender: string; dateOfBirth: string }

export default function ProfilePage() {
  const { t } = useApp();
  const { user, setUser } = useAuthStore();
  const { logout } = useAuthActions();

  const profile = useForm<ProfileForm>({
    values: { name: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '', gender: user?.gender ?? '', dateOfBirth: user?.dateOfBirth ?? '' },
  });
  const pw = useForm<{ currentPassword: string; newPassword: string }>();

  const saveProfile = async (d: ProfileForm) => {
    try {
      const { data } = await api<User>('/account/profile', {
        method: 'PATCH',
        body: { name: d.name, phone: d.phone || undefined, email: d.email || null, gender: d.gender || null, dateOfBirth: d.dateOfBirth || null },
      });
      setUser(data);
      toast.success(t('common.saved'));
    } catch (err) {
      toast.error((err as ApiError).errors?.[0]?.message || (err as Error).message);
    }
  };

  const changePassword = async (d: { currentPassword: string; newPassword: string }) => {
    try {
      await api('/auth/change-password', { method: 'POST', body: d });
      toast.success(t('account.passwordChanged'));
      await logout();
    } catch (err) {
      toast.error((err as ApiError).errors?.[0]?.message || (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 shadow-card">
        <h1 className="mb-4 text-lg font-semibold">{t('account.profile')}</h1>
        <form onSubmit={profile.handleSubmit(saveProfile)} className="grid gap-4 sm:grid-cols-2">
          <Field label={t('checkout.name')} required><Input {...profile.register('name', { required: true })} /></Field>
          <Field label={t('checkout.phone')} hint={user?.phoneVerifiedAt ? t('account.verified') : undefined}><Input type="tel" {...profile.register('phone')} /></Field>
          <Field label={t('checkout.email')}><Input type="email" {...profile.register('email')} /></Field>
          <Field label={t('account.gender')}>
            <Select {...profile.register('gender')}>
              <option value="">—</option>
              <option value="male">{t('account.male')}</option>
              <option value="female">{t('account.female')}</option>
              <option value="other">{t('account.other')}</option>
            </Select>
          </Field>
          <Field label={t('account.dob')}><Input type="date" {...profile.register('dateOfBirth')} /></Field>
          <div className="sm:col-span-2"><Button type="submit" loading={profile.formState.isSubmitting}>{t('common.save')}</Button></div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-semibold">{t('account.changePassword')}</h2>
        <form onSubmit={pw.handleSubmit(changePassword)} className="grid gap-4 sm:grid-cols-2">
          <Field label={t('account.currentPassword')}><Input type="password" autoComplete="current-password" {...pw.register('currentPassword')} /></Field>
          <Field label={t('auth.newPassword')} hint={t('validation.passwordMin')}><Input type="password" autoComplete="new-password" {...pw.register('newPassword', { required: true, minLength: 6 })} /></Field>
          <div className="sm:col-span-2"><Button type="submit" variant="outline" loading={pw.formState.isSubmitting}>{t('account.changePassword')}</Button></div>
        </form>
      </section>
    </div>
  );
}
