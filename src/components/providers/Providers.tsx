'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { getT, type TFn } from '@/lib/i18n';
import { lp } from '@/lib/routes';
import { refreshSession } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import type { Lang, Settings } from '@/types';

interface Ctx {
  lang: Lang;
  t: TFn;
  /** Locale-aware path helper */
  href: (path: string) => string;
  settings: Settings;
}

const AppContext = createContext<Ctx | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <Providers>');
  return ctx;
}

/** Restores the session from the refresh cookie, then loads cart + wishlist. */
function Bootstrap() {
  const status = useAuthStore((s) => s.status);
  const loadCart = useCartStore((s) => s.load);
  const initWishlist = useWishlistStore((s) => s.init);

  useEffect(() => {
    useCartStore.persist.rehydrate(); // show the saved cart right away; loadCart() refreshes it below
    refreshSession();
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    loadCart();
    initWishlist(status === 'authenticated');
  }, [status, loadCart, initWishlist]);

  return null;
}

export default function Providers({ lang, settings, children }: { lang: Lang; settings: Settings; children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } } }),
  );
  const value = useMemo<Ctx>(() => ({ lang, t: getT(lang), href: (p) => lp(lang, p), settings }), [lang, settings]);

  return (
    <AppContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        <Bootstrap />
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
      </QueryClientProvider>
    </AppContext.Provider>
  );
}
