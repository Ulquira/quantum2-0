import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { secureStorage } from '../utils/storage';

export const ProtectedRoute = () => {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const checkSession = async () => {
      const token = await secureStorage.getToken();
      const user = await secureStorage.getUser();
      if (!token || !user) {
        setStatus('unauthenticated');
        return;
      }
      setStatus('authenticated');
    };
    checkSession();
  }, []);

  if (status === 'loading') {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Verificando sesión...</div>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
