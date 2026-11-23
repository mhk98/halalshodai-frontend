'use client';

import { useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

export default function ProductGallery({ images, name, discount }: { images: { id: number; url: string; alt?: string | null }[]; name: string; discount?: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[active];

  return (
    <div>
      <div
        className="relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-white"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {current && (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-200"
            style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        )}
        {discount && <span className="absolute left-3 top-3 rounded-lg bg-red-500 px-2 py-1 text-sm font-bold text-white">{discount}</span>}
      </div>
      {images.length > 1 && (
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={clsx('relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white', i === active ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100')}
              aria-label={`Image ${i + 1}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
