'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useApp } from '@/components/providers/Providers';
import { useAuthActions, nextPath } from '@/hooks/useAuthActions';
import { useAuthStore } from '@/store/auth';
import { api, ApiError } from '@/lib/api-client';
import { Button, Field, Input, PageSpinner } from '@/components/ui';
import AuthCard from '@/components/account/AuthCard';
import type { User } from '@/types';

type Session = { user: User; accessToken: string };

function PasswordLogin() {
  const { t } = useApp();
  const { afterLogin, sessionId } = useAuthActions();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ identifier: string; password: string }>();

  const onSubmit = async (d: { identifier: string; password: string }) => {
    try {
      const { data } = await api<Session>('/auth/login', { method: 'POST', body: { ...d, sessionId: sessionId() } });
      toast.success(t('auth.welcome', { name: data.user.name }));
      await afterLogin(data);
    } catch (err) {
      toast.error((err as ApiError).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label={t('auth.identifier')} error={errors.identifier?.message}>
        <Input autoComplete="username" placeholder="01XXXXXXXXX / email" {...register('identifier', { required: t('validation.required') })} invalid={!!errors.identifier} />
      </Field>
      <Field label={t('auth.password')} error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register('password', { required: t('validation.required') })} invalid={!!errors.password} />
      </Field>
      <div className="text-right text-sm"><ForgotLink /></div>
      <Button type="submit" block size="lg" loading={isSubmitting}>{t('auth.login')}</Button>
    </form>
  );
}

function ForgotLink() {
  const { t, href } = useApp();
  return <Link href={href('/forgot-password')} className="text-brand-700 hover:underline">{t('auth.forgot')}</Link>;
}

function OtpLogin() {
  const { t } = useApp();
  const { afterLogin, sessionId } = useAuthActions();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await api('/auth/otp/request', { method: 'POST', body: { identifier: phone, purpose: 'login' } });
      setSent(true);
      toast.success(t('auth.otpSent'));
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    setBusy(true);
    try {
      const { data } = await api<Session>('/auth/otp/login', { method: 'POST', body: { identifier: phone, code, sessionId: sessionId() } });
      await afterLogin(data);
    } catch (err) {
      toast.error((err as ApiError).message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Field label={t('checkout.phone')}><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" disabled={sent} /></Field>
      {sent && (
        <Field label={t('auth.otpCode')} hint={t('auth.otpHint')}>
          <Input inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        </Field>
      )}
      {sent ? (
        <>
          <Button block size="lg" loading={busy} disabled={code.length < 4} onClick={verify}>{t('auth.verifyLogin')}</Button>
          <button type="button" onClick={() => { setSent(false); setCode(''); }} className="w-full text-sm text-brand-700 hover:underline">{t('auth.changeNumber')}</button>
        </>
      ) : (
        <Button block size="lg" loading={busy} disabled={phone.length < 11} onClick={send}>{t('auth.sendOtp')}</Button>
      )}
    </div>
  );
}

function Login() {
  const { t, href } = useApp();
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const [mode, setMode] = useState<'password' | 'otp'>('password');

  useEffect(() => {
    // Already logged in (or just logged in): go where ?next points, else to the account page.
    if (status === 'authenticated') router.replace(href(nextPath()));
  }, [status, router, href]);

  if (status !== 'guest') return <PageSpinner />;

  return (
    <AuthCard title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')} footer={<>{t('auth.noAccount')} <Link href={href('/register')} className="font-semibold text-brand-700 hover:underline">{t('auth.register')}</Link></>}>
      <div className="mb-5 grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm">
        {(['password', 'otp'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={clsx('rounded-md py-2 font-medium', mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600')}>
            {m === 'password' ? t('auth.withPassword') : t('auth.withOtp')}
          </button>
        ))}
      </div>
      {mode === 'password' ? <PasswordLogin /> : <OtpLogin />}
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Login />
    </Suspense>
  );
}
