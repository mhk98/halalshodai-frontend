'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/Providers';
import { api, cartSession } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import type { User } from '@/types';

/**
 * Where to go after logging in: the ?next path if it is a safe same-site path, else /account.
 * Read it before any await: once the session is set, the login page itself redirects and the
 * query string is gone.
 */
export function nextPath() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

/** Shared login/logout helpers: merges the guest cart and redirects to ?next. */
export function useAuthActions() {
  const router = useRouter();
  const { href } = useApp();

  const afterLogin = async (data: { user: User; accessToken: string }) => {
    const next = nextPath();
    // The server merged the guest cart (we sent sessionId); the user's cart is used from now on.
    cartSession.set(null);
    useAuthStore.getState().setSession(data.user, data.accessToken);
    await useCartStore.getState().load();
    router.replace(href(next));
  };

  /**
   * Full page load after logout: avoids the account guard redirecting to /login first,
   * and drops every per-user cache (orders, addresses…) from memory on shared computers.
   */
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    cartSession.set(null);
    window.location.assign(href('/'));
  };

  return { afterLogin, logout, sessionId: () => cartSession.get() ?? undefined };
}
