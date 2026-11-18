import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../../../lib/apiClient';
import { env } from '../../../config/env';
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
    const payload = { documento: cleanDoc, documentNumber: cleanDoc, password: cleanPass };

    try {
      let data: any;
      try {
        const res = await apiClient.post('/auth/login', payload);
        data = res.data;
      } catch (primaryErr: any) {
        if (primaryErr.response) throw primaryErr;
        // Fallback inmediato a localhost:5000 si la IP de red cambió
        const fallbackRes = await axios.post('http://localhost:5000/api/auth/login', payload, {
          timeout: 10000,
        });
        data = fallbackRes.data;
      }

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

      setError(`Verifica que el servidor local esté corriendo en el puerto 5000 (${env.API_BASE_URL})`);
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
