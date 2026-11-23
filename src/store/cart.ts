'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, cartSession } from '@/lib/api-client';
import type { Cart, CartLine } from '@/types';

/** What a product card / product page already knows, so the line can be shown before the server answers. */
export type CartPreview = Pick<CartLine, 'name' | 'nameBn' | 'slug' | 'image' | 'unitPrice' | 'regularPrice' | 'stock'> &
  Partial<Pick<CartLine, 'variantName' | 'variantNameBn'>>;

const EMPTY: Cart = { sessionId: null, items: [], itemCount: 0, subtotal: 0, hasIssues: false };

let tempId = 0;
/** The cart with `quantity` more of a product, computed locally (instant feedback before the server answers). */
function withAdded(cart: Cart, productId: number, variantId: number | null, quantity: number, preview: CartPreview): Cart {
  const existing = cart.items.find((l) => l.productId === productId && l.variantId === variantId);
  const items = existing
    ? cart.items.map((l) => (l === existing ? { ...l, quantity: l.quantity + quantity, lineTotal: l.unitPrice * (l.quantity + quantity) } : l))
    : [...cart.items, { id: --tempId, productId, variantId, ...preview, quantity, lineTotal: preview.unitPrice * quantity, issue: null }];
  return {
    ...cart,
    items,
    itemCount: cart.itemCount + quantity,
    subtotal: cart.subtotal + (existing?.unitPrice ?? preview.unitPrice) * quantity,
  };
}

/**
 * Server calls for adds run one at a time (the screen updates instantly anyway). This keeps answers in
 * order, and makes a guest's quick second add wait for the first, which creates the cart session;
 * otherwise each would create its own guest cart.
 */
let addQueue: Promise<unknown> = Promise.resolve();
let addsInFlight = 0;

interface CartState {
  cart: Cart;
  loaded: boolean;
  busy: boolean;
  drawerOpen: boolean;
  /** Whether the drawer has already been opened automatically after an add (this page visit). */
  drawerShownOnAdd: boolean;
  openDrawer: (open?: boolean) => void;
  /**
   * Call after adding to the cart. The first add opens the drawer so the customer sees the cart. If it
   * is open (desktop side panel) it just updates; if they closed it, later adds don't reopen it.
   * @returns true if the cart is visible (otherwise show a short "added" notice).
   */
  revealAfterAdd: () => boolean;
  load: () => Promise<void>;
  /**
   * Add to the cart. With a `preview`, the line appears at once (temporary negative id) and is replaced
   * by the server's cart when it answers; on failure the cart is reloaded from the server and the error thrown.
   */
  add: (productId: number, variantId: number | null, quantity?: number, preview?: CartPreview) => Promise<Cart>;
  update: (itemId: number, quantity: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  reset: () => void;
}

/**
 * The server holds the real cart: guests via the X-Session-Id header, logged-in customers on their
 * account (a guest cart is merged in at login). A copy is kept in localStorage so the header count
 * and the cart drawer show immediately on the next visit; `load()` then replaces it with the
 * server's version, which has current prices and stock. `loaded` is not persisted, so checkout
 * always waits for the server copy.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      const apply = (cart: Cart) => {
        if (cart.sessionId) cartSession.set(cart.sessionId);
        set({ cart, loaded: true });
        return cart;
      };
      const run = async (fn: () => Promise<{ data: Cart }>) => {
        set({ busy: true });
        try {
          return apply((await fn()).data);
        } finally {
          set({ busy: false });
        }
      };

      return {
        cart: EMPTY,
        loaded: false,
        busy: false,
        drawerOpen: false,
        drawerShownOnAdd: false,
        openDrawer: (open = true) => set({ drawerOpen: open }),
        revealAfterAdd: () => {
          if (get().drawerOpen) return true; // already showing: it updates in place
          if (get().drawerShownOnAdd) return false;
          set({ drawerOpen: true, drawerShownOnAdd: true });
          return true;
        },
        load: async () => {
          try {
            apply((await api<Cart>('/cart')).data);
          } catch {
            set({ loaded: true });
          }
        },
        add: async (productId, variantId, quantity = 1, preview) => {
          if (!preview) return run(() => api<Cart>('/cart/items', { method: 'POST', body: { productId, variantId, quantity } }));
          set({ cart: withAdded(get().cart, productId, variantId, quantity, preview) });
          addsInFlight += 1;
          const request = addQueue.then(() => api<Cart>('/cart/items', { method: 'POST', body: { productId, variantId, quantity } }));
          addQueue = request.catch(() => {});
          try {
            const { data } = await request;
            addsInFlight -= 1;
            if (data.sessionId) cartSession.set(data.sessionId); // a guest's first add creates the session
            // Apply the server's cart only after the last queued add, so pending lines aren't dropped meanwhile.
            if (addsInFlight === 0) apply(data);
            return data;
          } catch (err) {
            addsInFlight -= 1;
            if (addsInFlight === 0) await get().load(); // drop the line that couldn't be added
            throw err;
          }
        },
        update: async (itemId, quantity) => {
          await run(() => api<Cart>(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } }));
        },
        remove: async (itemId) => {
          await run(() => api<Cart>(`/cart/items/${itemId}`, { method: 'DELETE' }));
        },
        reset: () => set({ cart: EMPTY }),
      };
    },
    {
      name: 'cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cart: s.cart }),
      // Rehydrated from <Bootstrap> after mount, so the server render and the first client render match.
      skipHydration: true,
    },
  ),
);
