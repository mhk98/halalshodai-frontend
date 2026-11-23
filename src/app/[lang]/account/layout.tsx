import type { Metadata } from 'next';
import { getT } from '@/lib/i18n';
import AccountShell from './AccountShell';
import type { Lang } from '@/types';

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  return { title: getT(params.lang)('account.title'), robots: { index: false, follow: false } };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
