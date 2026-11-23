'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { configureTracking, gaPageView, track, type GoogleAdsConfig } from '@/lib/analytics';

/**
 * Loads GA4 / Google Ads (one gtag.js), the Facebook Pixel and the TikTok Pixel. IDs and switches
 * come from admin settings (Marketing Tools) with env fallback. Page views are sent on every
 * client-side navigation. `serverEvents`: also post events to the API for Meta / TikTok server-side.
 */
export default function Analytics({
  gaId,
  pixelId,
  tiktokPixelId,
  googleAds,
  serverEvents = false,
}: {
  gaId?: string;
  pixelId?: string;
  tiktokPixelId?: string;
  googleAds?: GoogleAdsConfig | null;
  serverEvents?: boolean;
}) {
  const pathname = usePathname();
  const safeGa = gaId && /^G-[A-Z0-9]+$/i.test(gaId) ? gaId : undefined;
  const safeAds = googleAds && /^AW-\d+$/.test(googleAds.id) ? googleAds : null;
  const safePixel = pixelId && /^\d+$/.test(pixelId) ? pixelId : undefined;
  const safeTikTok = tiktokPixelId && /^[A-Za-z0-9]+$/.test(tiktokPixelId) ? tiktokPixelId : undefined;
  configureTracking({ serverEvents, googleAds: safeAds, facebook: Boolean(safePixel), tiktok: Boolean(safeTikTok), gtag: Boolean(safeGa || safeAds) }); // before the first event below

  useEffect(() => {
    if (safeGa) gaPageView(safeGa, pathname);
    track.pageView(); // Facebook + TikTok (if loaded) + server copy (if enabled)
  }, [pathname, safeGa]);

  const gtagId = safeGa || safeAds?.id;
  const gtagConfig = [
    safeGa && `gtag('config','${safeGa}',{send_page_view:false});`,
    safeAds && `gtag('config','${safeAds.id}');`,
  ].filter(Boolean).join('');

  return (
    <>
      {gtagId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());${gtagConfig}`}
          </Script>
        </>
      )}
      {safePixel && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${safePixel}');`}
        </Script>
      )}
      {safeTikTok && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${safeTikTok}');}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}
