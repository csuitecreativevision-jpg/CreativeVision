import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { QueryProvider } from './providers/QueryProvider';
import App from './App.tsx';
import './index.css';
import 'sweetalert2/dist/sweetalert2.min.css';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('cv-native-shell');
}

const preMountStartMs = performance.now();
const dismissPreMountSplash = (minDelayMs = 0) => {
  const splash = document.getElementById('cv-pre-mount-splash');
  const root = document.getElementById('root');
  if (!splash || !root) return;
  const elapsed = performance.now() - preMountStartMs;
  const waitMs = Math.max(0, minDelayMs - elapsed);
  window.setTimeout(() => {
    root.classList.add('cv-mounted');
    window.setTimeout(() => {
      splash.classList.add('cv-hide');
      window.setTimeout(() => splash.remove(), 980);
    }, 180);
  }, waitMs);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryProvider>
  </StrictMode>
);

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    dismissPreMountSplash(Capacitor.isNativePlatform() ? 4000 : 0);
  });
});

if (Capacitor.isNativePlatform()) {
  const hideNativeSplash = () => {
    void SplashScreen.hide({ fadeOutDuration: 90 });
  };

  // Hide as early as possible after first React paint.
  window.requestAnimationFrame(hideNativeSplash);

  if (document.readyState === 'complete') {
    hideNativeSplash();
  } else {
    window.addEventListener('load', hideNativeSplash, { once: true });
  }

  // Fail-safe (short): avoid any lingering native splash.
  window.setTimeout(() => {
    void SplashScreen.hide({ fadeOutDuration: 0 });
  }, 900);
}
