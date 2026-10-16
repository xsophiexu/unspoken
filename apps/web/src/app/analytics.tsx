import Script from 'next/script';

// Google Analytics (gtag.js), loaded only when NEXT_PUBLIC_GA_ID is set.
export function Analytics({ measurementId }: { measurementId: string | undefined }) {
  if (!measurementId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(measurementId)});`}
      </Script>
    </>
  );
}
