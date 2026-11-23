'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import type { Banner } from '@/types';

/**
 * Auto-playing hero slider; mobile image on small screens, pauses on hover, swipeable on touch.
 * Banners are usually finished artwork with the text in the image, so the text overlay is drawn only
 * when the banner has a subtitle or button text (the title is always used as alt text).
 */
export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const { href } = useApp();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = banners.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (n < 2 || paused) return;
    const id = setInterval(() => go(1), 5000);
    return () => clearInterval(id);
  }, [n, paused, go]);

  if (!n) return null;

  const linkFor = (b: Banner) => (b.link ? (b.link.startsWith('/') ? href(b.link) : b.link) : undefined);

  return (
    <section
      className="relative touch-pan-y overflow-hidden rounded-2xl bg-white"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
      aria-roledescription="carousel"
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, idx) => {
          const link = linkFor(b);
          const overlay = Boolean(b.subtitle || b.buttonText);
          const img = (
            <div className={clsx('relative w-full', b.mobileImage ? 'aspect-[4/3] sm:aspect-[1085/400]' : 'aspect-[1085/400]')}>
              <Image src={b.image} alt={b.title} fill priority={idx === 0} sizes="(max-width: 1024px) 100vw, 75vw" className={clsx('object-cover', b.mobileImage && 'hidden sm:block')} />
              {b.mobileImage && <Image src={b.mobileImage} alt={b.title} fill priority={idx === 0} sizes="100vw" className="object-cover sm:hidden" />}
              {overlay && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />
                  <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-end p-6 text-white sm:justify-center sm:p-12">
                    <h2 className="text-2xl font-bold drop-shadow sm:text-4xl">{b.title}</h2>
                    {b.subtitle && <p className="mt-2 text-sm drop-shadow sm:text-lg">{b.subtitle}</p>}
                    {b.buttonText && link && <span className="mt-4 inline-block w-fit rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-gray-900">{b.buttonText}</span>}
                  </div>
                </>
              )}
            </div>
          );
          return (
            <div key={b.id} className="w-full shrink-0" aria-hidden={idx !== i}>
              {link ? <Link href={link} tabIndex={idx === i ? 0 : -1}>{img}</Link> : img}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow hover:bg-white sm:flex" aria-label="Previous slide">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow hover:bg-white sm:flex" aria-label="Next slide">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, idx) => (
              <button key={b.id} type="button" onClick={() => setI(idx)} className={clsx('h-2 rounded-full transition-all', idx === i ? 'w-6 bg-white' : 'w-2 bg-white/60')} aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
