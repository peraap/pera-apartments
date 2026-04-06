const FB_PIXEL_ID = '1939919056723654';
if (typeof window !== 'undefined') {
  (window as any).fbq = (window as any).fbq || function() {
    ((window as any).fbq.q = (window as any).fbq.q || []).push(arguments);
  };
  (window as any)._fbq = (window as any)._fbq || (window as any).fbq;
  (window as any).fbq.push = (window as any).fbq;
  (window as any).fbq.loaded = true;
  (window as any).fbq.version = '2.0';
  (window as any).fbq.queue = [];

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';

  // Apelăm init și track DUPĂ ce scriptul s-a încărcat
  script.onload = () => {
    (window as any).fbq('init', FB_PIXEL_ID);
    (window as any).fbq('track', 'PageView');
  };

  document.head.appendChild(script);
}
