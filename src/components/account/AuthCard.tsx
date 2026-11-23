import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';

export default function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><Leaf className="h-6 w-6" /></span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-card">{children}</div>
        {footer && <div className="mt-5 text-center text-sm text-gray-600">{footer}</div>}
      </div>
    </div>
  );
}
