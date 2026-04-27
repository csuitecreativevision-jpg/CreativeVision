import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creativevision.app',
  appName: 'CreativeVision',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
