'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { WhatsAppIcon, MessengerIcon } from '@/components/icons';

/** Floating WhatsApp / Messenger buttons (numbers from admin settings, env fallback). */
export default function FloatingChat() {
  const { settings, t } = useApp();
  const [open, setOpen] = useState(false);
  const whatsapp = String(settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const messenger = String(settings.messenger || process.env.NEXT_PUBLIC_MESSENGER_URL || '');
  if (!whatsapp && !messenger) return null;

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-30 flex flex-col items-end gap-3 sm:bottom-6 sm:right-4">
      {open && (
        <>
          {messenger && (
            <a href={messenger} target="_blank" rel="noopener noreferrer" className="flex animate-fade-in items-center gap-2 rounded-full bg-[#0084ff] py-2 pl-3 pr-4 text-sm font-medium text-white shadow-lg">
              <MessengerIcon /> Messenger
            </a>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex animate-fade-in items-center gap-2 rounded-full bg-[#25d366] py-2 pl-3 pr-4 text-sm font-medium text-white shadow-lg">
              <WhatsAppIcon /> WhatsApp
            </a>
          )}
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 ring-4 ring-white/70 sm:h-14 sm:w-14 sm:ring-0 text-white shadow-xl transition hover:bg-brand-700"
        aria-label={t('chat.label')}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
      </button>
    </div>
  );
}
