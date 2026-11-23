'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useApp } from '@/components/providers/Providers';
import { useAuthActions } from '@/hooks/useAuthActions';
import { api, ApiError } from '@/lib/api-client';
import { BD_PHONE } from '@/lib/format';
import { Button, Field, Input, PageSpinner } from '@/components/ui';
import AuthCard from '@/components/account/AuthCard';
import type { User } from '@/types';
import { track } from '@/lib/analytics';

function Register() {
  const { t, href } = useApp();
  const { afterLogin, sessionId } = useAuthActions();

  const schema = z
    .object({
      name: z.string().trim().min(2, t('validation.name')),
      phone: z.string().trim().refine((v) => BD_PHONE.test(v.replace(/[\s-]/g, '')), t('validation.phone')),
      email: z.string().trim().email(t('validation.email')).or(z.literal('')),
      password: z.string().min(6, t('validation.passwordMin')),
      confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, { path: ['confirm'], message: t('validation.passwordMatch') });
  type Form = z.infer<typeof schema>;

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ confirm: _c, email, ...d }: Form) => {
    try {
      const { data } = await api<{ user: User; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: { ...d, email: email || undefined, sessionId: sessionId() },
      });
      toast.success(t('auth.registered'));
      track.completeRegistration();
      await afterLogin(data);
    } catch (err) {
      const e = err as ApiError;
      e.errors?.forEach((fe) => (['name', 'phone', 'email', 'password'] as const).includes(fe.path as 'name') && setError(fe.path as keyof Form, { message: fe.message }));
      toast.error(e.message);
    }
  };

  return (
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} footer={<>{t('auth.haveAccount')} <Link href={href('/login')} className="font-semibold text-brand-700 hover:underline">{t('auth.login')}</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label={t('checkout.name')} required error={errors.name?.message}><Input autoComplete="name" {...register('name')} invalid={!!errors.name} /></Field>
        <Field label={t('checkout.phone')} required error={errors.phone?.message}><Input type="tel" autoComplete="tel" placeholder="01XXXXXXXXX" {...register('phone')} invalid={!!errors.phone} /></Field>
        <Field label={t('checkout.email')} error={errors.email?.message}><Input type="email" autoComplete="email" {...register('email')} invalid={!!errors.email} /></Field>
        <Field label={t('auth.password')} required error={errors.password?.message}><Input type="password" autoComplete="new-password" {...register('password')} invalid={!!errors.password} /></Field>
        <Field label={t('auth.confirmPassword')} required error={errors.confirm?.message}><Input type="password" autoComplete="new-password" {...register('confirm')} invalid={!!errors.confirm} /></Field>
        <Button type="submit" block size="lg" loading={isSubmitting}>{t('auth.register')}</Button>
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Register />
    </Suspense>
  );
}
