import { useEffect, useState } from 'react';
import { UserCheck, IdCard, MapPin, LogOut } from 'lucide-react';
import { secureStorage } from '../../../utils/storage';
import { useAuth } from '../hooks/useAuth';
import type { TechnicianUser } from '../types/auth.types';

export const ProfileView = () => {
  const [user, setUser] = useState<TechnicianUser | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    secureStorage.getUser().then(setUser);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
          <UserCheck className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{user?.fullName || 'Técnico'}</h2>
          <p className="text-xs text-emerald-400 font-medium">Activo en turno</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 flex items-center gap-2">
            <IdCard className="w-4 h-4 text-slate-500" /> Documento
          </span>
          <span className="font-semibold text-white">{user?.documentNumber}</span>
        </div>
        <div className="flex items-center justify-between text-sm border-t border-slate-800 pt-3">
          <span className="text-slate-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" /> Zona Asignada
          </span>
          <span className="font-semibold text-white">{user?.zone}</span>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Cerrar Sesión
      </button>
    </div>
  );
};

export default ProfileView;