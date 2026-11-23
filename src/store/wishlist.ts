'use client';

import { create } from 'zustand';
import { api } from '@/lib/api-client';
import type { ProductCard } from '@/types';

const LOCAL_KEY = 'wishlist';

const readLocal = (): ProductCard[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeLocal = (items: ProductCard[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
};

interface WishlistState {
  items: ProductCard[];
  remote: boolean;
  /** Guests: localStorage. Logged in: API (local items are merged in once). */
  init: (loggedIn: boolean) => Promise<void>;
  toggle: (product: ProductCard) => Promise<boolean>;
  has: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  remote: false,
  init: async (loggedIn) => {
    if (!loggedIn) {
      set({ items: readLocal(), remote: false });
      return;
    }
    const local = readLocal();
    try {
      for (const p of local) await api('/wishlist', { method: 'POST', body: { productId: p.id } }).catch(() => {});
      if (local.length) writeLocal([]);
      const { data } = await api<ProductCard[]>('/wishlist');
      set({ items: data, remote: true });
    } catch {
      set({ items: local, remote: false });
    }
  },
  has: (id) => get().items.some((p) => p.id === id),
  toggle: async (product) => {
    const exists = get().has(product.id);
    if (get().remote) {
      const { data } = exists
        ? await api<ProductCard[]>(`/wishlist/${product.id}`, { method: 'DELETE' })
        : await api<ProductCard[]>('/wishlist', { method: 'POST', body: { productId: product.id } });
      set({ items: data });
    } else {
      const items = exists ? get().items.filter((p) => p.id !== product.id) : [product, ...get().items];
      writeLocal(items);
      set({ items });
    }
    return !exists;
  },
}));
