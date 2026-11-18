import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winet.quantum2',
  appName: 'Quantum 2.0',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
