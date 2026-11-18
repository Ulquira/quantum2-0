import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { ordersService } from '../services/ordersStore';
import type { WinOrder, OrderWorkflowStatus } from '../types/order.types';

const STATUS_BADGE: Record<OrderWorkflowStatus, { label: string; bg: string; text: string; dot: string }> = {
  AGENDADA: {
    label: 'Agendada',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  'EN CAMINO': {
    label: 'En Camino',
    bg: 'bg-[#FFF1E6]',
    text: 'text-[#FF5500]',
    dot: 'bg-[#FF5500]',
  },
  'EN PROCESO': {
    label: 'En Proceso',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  FINALIZADO: {
    label: 'Finalizado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
};

export const OrdersListView = () => {
  const [orders, setOrders] = useState<WinOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ACTIVAS' | 'FINALIZADAS' | 'TODAS'>('ACTIVAS');
  const navigate = useNavigate();

  useEffect(() => {
    ordersService
      .fetchMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (filter === 'ACTIVAS') return o.EstadoOT !== 'FINALIZADO';
    if (filter === 'FINALIZADAS') return o.EstadoOT === 'FINALIZADO';
    return true;
  });

  if (loading) {
    return (
      <div className="p-10 text-center text-xs font-bold text-slate-400">
        Cargando órdenes...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera minimalista + contador */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Mis Órdenes de Hoy</h2>
          <p className="text-xs font-medium text-slate-400">Toca una orden para ver el detalle e iniciar</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFF1E6] text-[#FF5500]">
          {filtered.length} OT
        </span>
      </div>

      {/* Tabs limpios */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
        {(['ACTIVAS', 'FINALIZADAS', 'TODAS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              filter === tab
                ? 'bg-white text-[#FF5500] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tarjetas Minimalistas */}
      <div className="space-y-3">
        {filtered.map((order) => {
          const badge = STATUS_BADGE[order.EstadoOT] || STATUS_BADGE.AGENDADA;
          const completedTasks = order.tasks.filter((t) => t.completado).length;

          return (
            <div
              key={order.OrdenId}
              onClick={() => navigate(`/orders/${order.OrdenId}`)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:border-[#FF5500]/40 active:scale-[0.99] transition-all cursor-pointer"
            >
              {/* Fila 1: Código OT + Tipo | Badge de Estado */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#FF5500]">
                    #{order.OrdenId}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {order.TipoOrden}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${badge.bg} ${badge.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>

              {/* Fila 2: Cliente y Trabajo */}
              <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug">
                {order.Cliente}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {order.TipoTraba} • <span className="text-slate-700 font-bold">{order.Producto}</span>
              </p>

              {/* Fila 3: Dirección compacta */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <span className="truncate">
                  {order.Direccion} • <strong className="text-slate-700">{order.Localidad}</strong>
                </span>
              </div>

              {/* Fila 4: Horario y Flecha de acción */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {order.FVisita}
                </span>

                <span className="font-extrabold text-[#FF5500] flex items-center gap-0.5">
                  {order.EstadoOT === 'AGENDADA'
                    ? 'Ver e Iniciar'
                    : order.EstadoOT === 'EN CAMINO'
                    ? 'Llegué al punto'
                    : order.EstadoOT === 'EN PROCESO'
                    ? `Continuar (${completedTasks}/${order.tasks.length})`
                    : 'Ver resumen'}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersListView;
