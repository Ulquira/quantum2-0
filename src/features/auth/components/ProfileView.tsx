import { useEffect, useState } from 'react';
import { UserCheck, IdCard, MapPin, LogOut, Server } from 'lucide-react';
import { secureStorage } from '../../../utils/storage';
import { useAuth } from '../hooks/useAuth';
import { env } from '../../../config/env';
import type { TechnicianUser } from '../types/auth.types';

export const ProfileView = () => {
  const [user, setUser] = useState<TechnicianUser | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    secureStorage.getUser().then(setUser);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF1E6] text-[#FF5500] flex items-center justify-center">
          <UserCheck className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">{user?.fullName || 'Técnico WIN'}</h2>
          <p className="text-xs text-emerald-600 font-bold">● Activo en turno (bd_phoenix)</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-2">
            <IdCard className="w-4 h-4 text-[#FF5500]" /> Documento
          </span>
          <span className="font-extrabold text-slate-900">{user?.documentNumber}</span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
          <span className="text-slate-500 font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF5500]" /> Rol / Zona
          </span>
          <span className="font-extrabold text-slate-900">{user?.zone}</span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
          <span className="text-slate-500 font-semibold flex items-center gap-2">
            <Server className="w-4 h-4 text-[#FF5500]" /> API Activa
          </span>
          <span className="font-mono text-[11px] font-bold text-slate-600 truncate max-w-[180px]">
            {env.API_BASE_URL}
          </span>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Cerrar Sesión
      </button>
    </div>
  );
};

export default ProfileView;
