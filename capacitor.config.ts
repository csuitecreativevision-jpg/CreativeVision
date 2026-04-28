import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creativevision.app',
  appName: 'CreativeVision',
  webDir: 'dist',
  /** Match portal background; reduces flash before WebView paints */
  backgroundColor: '#020204',
  server: {
    androidScheme: 'https',
  },
  android: {
    /** Use app dark chrome while WebView loads */
    backgroundColor: '#020204',
  },
  ios: {
    backgroundColor: '#020204',
    /**
     * Use mobile layout on iPad (otherwise WKWebView may act like desktop and
     * break Tailwind breakpoints / fixed widths).
     */
    preferredContentMode: 'mobile',
    /**
     * Let the scroll view participate in safe-area insets (notches, home indicator).
     */
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  plugins: {
    /**
     * Capacitor 8: injects --safe-area-inset-* CSS variables on Android for edge-to-edge.
     * Keep default `css`; combine with env(safe-area-inset-*) in UI as already used.
     */
    SystemBars: {
      insetsHandling: 'css',
    },
  },
};

export default config;
