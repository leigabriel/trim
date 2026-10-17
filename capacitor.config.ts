import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trim.app',
  appName: 'Trim - Your Best Haircut',
  // dist-mobile, not dist. The web build carries the Three.js hero and the 3D
  // intro; neither exists in the native app, and shipping them would add
  // megabytes every phone downloads and never uses.
  webDir: 'dist-mobile',
};

export default config;