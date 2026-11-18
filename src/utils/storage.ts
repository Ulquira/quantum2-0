import { Preferences } from '@capacitor/preferences';
import { platform } from './platform';
import type { TechnicianUser } from '../features/auth/types/auth.types';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'technician_user';

export const secureStorage = {
  async setToken(token: string): Promise<void> {
    if (platform.isNativeMobile) {
      await Preferences.set({ key: TOKEN_KEY, value: token });
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },

  async getToken(): Promise<string | null> {
    if (platform.isNativeMobile) {
      const { value } = await Preferences.get({ key: TOKEN_KEY });
      return value;
    }
    return sessionStorage.getItem(TOKEN_KEY);
  },

  async setUser(user: TechnicianUser): Promise<void> {
    const raw = JSON.stringify(user);
    if (platform.isNativeMobile) {
      await Preferences.set({ key: USER_KEY, value: raw });
    } else {
      sessionStorage.setItem(USER_KEY, raw);
    }
  },

  async getUser(): Promise<TechnicianUser | null> {
    if (platform.isNativeMobile) {
      const { value } = await Preferences.get({ key: USER_KEY });
      return value ? (JSON.parse(value) as TechnicianUser) : null;
    }
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as TechnicianUser) : null;
  },

  async clearSession(): Promise<void> {
    if (platform.isNativeMobile) {
      await Preferences.remove({ key: TOKEN_KEY });
      await Preferences.remove({ key: USER_KEY });
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  },

  async clearToken(): Promise<void> {
    await this.clearSession();
  },
};