import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const dismissPreMountSplash = () => {
  const splash = document.getElementById('cv-pre-mount-splash');
  const root = document.getElementById('root');
  if (!splash || !root) return;
  root.classList.add('cv-mounted');
  window.setTimeout(() => {
    splash.classList.add('cv-hide');
    window.setTimeout(() => splash.remove(), 980);
  }, 180);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(dismissPreMountSplash);
});
