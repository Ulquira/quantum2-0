import { ClipboardList, MapPin, ChevronRight, Clock } from 'lucide-react';

const MOCK_ORDERS = [
  {
    id: 'ORD-9041',
    client: 'Carlos Mendoza',
    address: 'Av. Javier Prado Este 2450, San Borja',
    type: 'Instalación Fibra Óptica FTTH',
    status: 'EN_CURSO',
    tasksCompleted: 1,
    totalTasks: 4,
  },
  {
    id: 'ORD-9045',
    client: 'María Fernández',
    address: 'Calle Las Begonias 415, San Isidro',
    type: 'Avería / Cambio de ONT',
    status: 'PENDIENTE',
    tasksCompleted: 0,
    totalTasks: 3,
  },
];

export const OrdersListView = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Mis Órdenes Asignadas</h2>
          <p className="text-xs text-slate-400">Selecciona una orden para completar tareas y fotos</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400">
          {MOCK_ORDERS.length} hoy
        </span>
      </div>

      <div className="space-y-3">
        {MOCK_ORDERS.map((order) => (
          <div
            key={order.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg">
                {order.id}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  order.status === 'EN_CURSO'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Clock className="w-3 h-3" />
                {order.status === 'EN_CURSO' ? 'En Curso' : 'Pendiente'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white">{order.client}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{order.type}</p>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{order.address}</span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Tareas: <strong className="text-white">{order.tasksCompleted}/{order.totalTasks}</strong>
                </span>
              </div>
              <span className="text-xs font-semibold text-blue-400 flex items-center">
                Abrir orden <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersListView;