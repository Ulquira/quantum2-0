import { Capacitor } from '@capacitor/core';

export const platform = {
  isNativeMobile: Capacitor.isNativePlatform(),
  isAndroid: Capacitor.getPlatform() === 'android',
  isIOS: Capacitor.getPlatform() === 'ios',
  isWebControl: Capacitor.getPlatform() === 'web',
  current: Capacitor.getPlatform(),
};