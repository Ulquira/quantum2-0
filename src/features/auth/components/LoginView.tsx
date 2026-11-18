import { useState, type FormEvent } from 'react';
import { Lock, IdCard, Wifi } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginView = () => {
  const [documentNumber, setDocumentNumber] = useState('111');
  const [password, setPassword] = useState('111');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ documentNumber, password });
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F8F9FB] max-w-md mx-auto">
      {/* Cabecera Curva Naranja WIN */}
      <div className="bg-[#FF5500] text-white px-6 pt-12 pb-16 rounded-b-[2.5rem] shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-4xl font-black tracking-tighter">win</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
            <Wifi className="w-3.5 h-3.5" /> Quantum 2.0
          </span>
        </div>
        <h1 className="text-2xl font-extrabold mt-4">Portal de Técnicos</h1>
        <p className="text-xs text-orange-100 mt-1">Ingresa con tu documento para gestionar tus órdenes asignadas</p>
      </div>

      {/* Tarjeta Blanca Flotante */}
      <div className="px-5 -mt-8 flex-1">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-[#FFF3EC] border border-[#FF5500]/30 text-[#FF5500] text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">N° de Documento</label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ej. 111 o 74859612"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#FF5500] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#FF5500] focus:bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Si es tu primer ingreso, tu contraseña inicial es tu mismo documento.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#FF5500] hover:bg-[#e04b00] active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-[#FF5500]/25 transition-all cursor-pointer"
            >
              {isLoading ? 'Ingresando...' : 'Iniciar Jornada'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default LoginView;
