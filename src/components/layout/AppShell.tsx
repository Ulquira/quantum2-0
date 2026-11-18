import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, User, Bell } from 'lucide-react';
import { useTechLocation } from '../../features/tracking/hooks/useTechLocation';
import { secureStorage } from '../../utils/storage';
import type { TechnicianUser } from '../../features/auth/types/auth.types';

export const AppShell = () => {
  useTechLocation();
  const [user, setUser] = useState<TechnicianUser | null>(null);

  useEffect(() => {
    secureStorage.getUser().then(setUser);
  }, []);

  const location = useLocation();
  const isInsideOrder = /^\/orders\/.+/.test(location.pathname);
  const firstName = user?.fullName?.split(' ')[0]?.toUpperCase() || 'TONNY';

  const navItems = [
    { to: '/orders', label: 'Mis Órdenes', icon: ClipboardList },
    { to: '/profile', label: 'Mi Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 flex flex-col max-w-md mx-auto shadow-xl">
      {!isInsideOrder && (
        <header className="bg-[#FF5500] text-white px-6 pt-6 pb-5 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[32px] font-black tracking-tighter leading-none">win</div>
              <p className="text-[17px] font-extrabold mt-1 tracking-tight">Hola, {firstName}</p>
            </div>

            <div className="relative p-2">
              <Bell className="w-6 h-6 text-white fill-white" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300 absolute top-2 right-2 border border-[#FF5500]" />
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 px-4 py-5 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-white border-t border-slate-100 flex items-center justify-around px-4 z-50">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs font-extrabold py-1 px-5 rounded-xl transition-colors ${
                isActive ? 'text-[#FF5500]' : 'text-slate-400'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
