import { useState, type FormEvent } from 'react';
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const ChangePasswordView = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { changePassword, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await changePassword({ currentPassword: '', newPassword, confirmPassword });
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F8F9FB] max-w-md mx-auto">
      <div className="bg-[#FF5500] text-white px-6 pt-10 pb-14 rounded-b-[2.5rem]">
        <div className="text-3xl font-black tracking-tighter">win</div>
        <h1 className="text-xl font-extrabold mt-3">Actualiza tu Contraseña</h1>
        <p className="text-xs text-orange-100 mt-1">
          Por seguridad, cambia tu clave inicial (documento) por una contraseña personal.
        </p>
      </div>

      <div className="px-5 -mt-8">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FF5500] flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Confirmar Contraseña</label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#FF5500] hover:bg-[#e04b00] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-[#FF5500]/25 transition-all cursor-pointer"
            >
              {isLoading ? 'Guardando...' : 'Guardar y Ver Mis Órdenes'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ChangePasswordView;
