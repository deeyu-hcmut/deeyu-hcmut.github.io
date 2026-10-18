import React from 'react';
import { sizedImage } from '../utils/image';

// Event cover image; an event without one shows the Đoàn - Hội logo instead.
export const EventBanner: React.FC<{ url?: string; alt: string; width: number; className?: string }> = ({ url, alt, width, className }) =>
  url ? (
    <img
      src={sizedImage(url, width)}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      className={className}
    />
  ) : (
    <div role="img" aria-label={alt} className={`${className ?? ''} flex items-center justify-center bg-slate-100 dark:bg-slate-800 p-[12%]`}>
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="max-h-full max-w-full object-contain" />
    </div>
  );
