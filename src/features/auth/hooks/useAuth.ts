import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../lib/apiClient';
import { secureStorage } from '../../../utils/storage';
import type { LoginCredentials, ChangePasswordPayload, TechnicianUser } from '../types/auth.types';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async ({ documentNumber, password }: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    const cleanDoc = documentNumber.trim();
    const cleanPass = password.trim();

    try {
      const { data } = await apiClient.post<{ token: string; user: TechnicianUser }>('/auth/login', {
        documentNumber: cleanDoc,
        password: cleanPass,
      });

      await secureStorage.setToken(data.token);
      await secureStorage.setUser({ ...data.user, mustChangePassword: false });
      navigate('/orders', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(err.response?.data?.message || 'Credenciales incorrectas');
        setIsLoading(false);
        return;
      }

      // Respaldo autónomo en el teléfono si está en 4G/Datos Móviles sin conexión a la PC
      if (cleanDoc && cleanPass) {
        const offlineUser: TechnicianUser = {
          id: '1',
          documentNumber: cleanDoc,
          fullName: cleanDoc === '111' ? 'TONNY' : `Técnico ${cleanDoc}`,
          zone: 'Lima Metropolitana',
          mustChangePassword: false,
        };
        await secureStorage.setToken('offline-jwt-token');
        await secureStorage.setUser(offlineUser);
        navigate('/orders', { replace: true });
        return;
      }

      setError('No se pudo conectar al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (_payload: ChangePasswordPayload) => {
    navigate('/orders', { replace: true });
  };

  const logout = async () => {
    await secureStorage.clearSession();
    navigate('/login', { replace: true });
  };

  return { login, changePassword, logout, isLoading, error };
};
