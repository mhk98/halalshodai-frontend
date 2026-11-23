'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore, type CartPreview } from '@/store/cart';
import { track } from '@/lib/analytics';
import { Button, type ButtonProps } from '@/components/ui';

interface Props extends Omit<ButtonProps, 'onClick'> {
  productId: number;
  variantId: number | null;
  name: string;
  price: number;
  quantity?: number;
  variantName?: string | null;
  label?: string;
  openDrawer?: boolean;
  onAdded?: () => void;
  /** Lets the cart show the line at once, before the server answers. */
  preview?: CartPreview;
}

/** Adds a product/variant to the cart, tracks it, and opens the drawer (first add only) or toasts. */
export default function AddToCartButton({ productId, variantId, name, price, quantity = 1, variantName, label, openDrawer = true, onAdded, preview, ...btn }: Props) {
  const { t } = useApp();
  const add = useCartStore((s) => s.add);
  const revealAfterAdd = useCartStore((s) => s.revealAfterAdd);
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const adding = add(productId, variantId, quantity, preview);
    const done = () => {
      track.addToCart({ id: productId, name, price, quantity, variant: variantName });
      // The drawer opens on the first add only; after that a short notice, so it needn't be closed each time.
      if (!openDrawer || !revealAfterAdd()) toast.success(t('cart.added'));
      onAdded?.();
    };
    if (preview) {
      // Shown in the cart at once; the server confirms in the background.
      done();
      adding.catch((err) => toast.error((err as Error).message));
      return;
    }
    setLoading(true);
    try {
      await adding;
      done();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handle} loading={loading} icon={<ShoppingCart className="h-4 w-4" />} {...btn}>
      {label ?? t('product.addToCart')}
    </Button>
  );
}
