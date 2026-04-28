import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { QueryProvider } from './providers/QueryProvider';
import App from './App.tsx';
import './index.css';
import 'sweetalert2/dist/sweetalert2.min.css';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('cv-native-shell');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryProvider>
  </StrictMode>
);
