import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// --- CONFIGURARE META PIXEL (SIMPLIFICATA) ---
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const FB_PIXEL_ID = '1939919056723654';

if (typeof window !== 'undefined') {
  // 1. Initializam obiectul fbq
  window.fbq = window.fbq || function() {
    (window.fbq.q = window.fbq.q || []).push(arguments);
  };
  window._fbq = window._fbq || window.fbq;
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = '2.0';
  window.fbq.queue = [];

  // 2. Cream si inseram script-ul manual
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://facebook.net';
  document.head.appendChild(script);

  // 3. Initializam Pixel-ul tau
  window.fbq('init', FB_PIXEL_ID);
  window.fbq('track', 'PageView');
}
// ---------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
