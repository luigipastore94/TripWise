import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Ensure open mobile PWAs and background browser tabs immediately detect and activate new deployments
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const hadActiveController = Boolean(navigator.serviceWorker.controller);
  let isRefreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadActiveController && !isRefreshing) {
      isRefreshing = true;
      window.location.reload();
    }
  });
}

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    const checkForUpdates = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        registration.update().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', checkForUpdates);
    window.addEventListener('focus', checkForUpdates);
    window.addEventListener('online', checkForUpdates);
    window.setInterval(checkForUpdates, 3 * 60 * 1000);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
