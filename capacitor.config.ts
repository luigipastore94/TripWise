import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tripwise.companion',
  appName: 'TripWise',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
