import Script from "next/script";

export function AdsenseScript() {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!adsenseClient) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
    />
  );
}
