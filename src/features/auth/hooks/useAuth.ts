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
      // Envía ambos campos (documento y documentNumber) para funcionar con /api/auth/login de win-dashboard
      const { data } = await apiClient.post<any>('/auth/login', {
        documento: cleanDoc,
        documentNumber: cleanDoc,
        password: cleanPass,
      });

      const rawUser = data.user || {};
      const normalizedUser: TechnicianUser = {
        id: String(rawUser.id || '1'),
        documentNumber: String(rawUser.documentNumber || rawUser.documento || cleanDoc),
        fullName: String(rawUser.fullName || rawUser.nombre || `Técnico ${cleanDoc}`),
        zone: String(rawUser.zone || rawUser.permisos?.rolNombre || 'Lima Metropolitana'),
        mustChangePassword: false,
      };

      await secureStorage.setToken(data.token);
      await secureStorage.setUser(normalizedUser);
      navigate('/orders', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 400 || err.response?.status === 403) {
        setError(err.response?.data?.error || err.response?.data?.message || 'Documento o contraseña incorrectos');
        setIsLoading(false);
        return;
      }

      setError('Error al conectar con win-dashboard-api.azurewebsites.net');
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
