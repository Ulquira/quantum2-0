import { platform } from '../../../utils/platform';

export const DashboardView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Bienvenido a Quantum 2.0</h2>
        <p className="text-sm text-slate-400">
          Modo de ejecución activo: {platform.isNativeMobile ? 'Aplicación Móvil Nativa' : 'Web de Control Central'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Estado de API Azure</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">Lista para conectar</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Plataforma</p>
          <p className="text-xl font-bold text-white mt-1 uppercase">{platform.current}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Arquitectura</p>
          <p className="text-xl font-bold text-blue-400 mt-1">Modular Feature-Sliced</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;