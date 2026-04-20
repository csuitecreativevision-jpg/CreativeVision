import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

  return {
    plugins: [react()],
    server: {
      // Same-origin `/functions/v1/*` in dev avoids CORS/preflight issues calling Edge Functions from localhost.
      proxy: supabaseUrl
        ? {
            '/functions/v1': {
              target: supabaseUrl,
              changeOrigin: true,
              secure: true,
            },
          }
        : {},
    },
  };
});
