'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useApp } from '@/components/providers/Providers';
import { api, ApiError } from '@/lib/api-client';
import { Button, Field, Input } from '@/components/ui';
import AuthCard from '@/components/account/AuthCard';

export default function ForgotPasswordPage() {
  const { t, href } = useApp();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [busy, setBusy] = useState(false);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/auth/otp/request', { method: 'POST', body: { identifier, purpose: 'reset_password' } });
      toast.success(t('auth.otpSent'));
      setStep('reset');
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error(t('validation.passwordMin'));
    setBusy(true);
    try {
      await api('/auth/password/reset', { method: 'POST', body: { identifier, code, newPassword: password } });
      toast.success(t('auth.resetDone'));
      router.replace(href('/login'));
    } catch (err) {
      toast.error((err as ApiError).message);
      setBusy(false);
    }
  };

  return (
    <AuthCard title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')} footer={<Link href={href('/login')} className="font-semibold text-brand-700 hover:underline">{t('auth.backToLogin')}</Link>}>
      {step === 'request' ? (
        <form onSubmit={request} className="space-y-4">
          <Field label={t('auth.identifier')}><Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="01XXXXXXXXX / email" required /></Field>
          <Button type="submit" block size="lg" loading={busy}>{t('auth.sendOtp')}</Button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">{t('auth.otpSentTo', { to: identifier })}</p>
          <Field label={t('auth.otpCode')}><Input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} maxLength={8} required /></Field>
          <Field label={t('auth.newPassword')}><Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          <Button type="submit" block size="lg" loading={busy}>{t('auth.resetPassword')}</Button>
        </form>
      )}
    </AuthCard>
  );
}
