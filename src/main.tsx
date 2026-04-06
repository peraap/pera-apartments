import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// --- CONFIGURARE META PIXEL (REPARATA) ---
const FB_PIXEL_ID = '1939919056723654';

if (typeof window !== 'undefined') {
  // 1. Inițializăm obiectul fbq fără erori de sintaxă
  (window as any).fbq = (window as any).fbq || function() {
    ((window as any).fbq.q = (window as any).fbq.q || []).push(arguments);
  };
  (window as any)._fbq = (window as any)._fbq || (window as any).fbq;
  (window as any).fbq.push = (window as any).fbq;
  (window as any).fbq.loaded = true;
  (window as any).fbq.version = '2.0';
  (window as any).fbq.queue = [];

  // 2. Creăm elementul script manual pentru a evita eroarea "insertBefore"
  const script = document.createElement('script');
  script.async = true;
  // URL-UL COMPLET ȘI CORECT:
  script.src = 'https://facebook.net';
  
  // Îl adăugăm în HEAD, cea mai sigură metodă în React
  document.head.appendChild(script);

  // 3. Activăm Pixel-ul
  (window as any).fbq('init', FB_PIXEL_ID);
  (window as any).fbq('track', 'PageView');
}
// ----------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
