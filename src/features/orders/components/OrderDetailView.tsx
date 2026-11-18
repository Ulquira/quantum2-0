import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Play,
  Truck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
} from 'lucide-react';
import { ordersService } from '../services/ordersStore';
import { OrderNetworkMap } from './OrderNetworkMap';
import { useTechLocation } from '../../tracking/hooks/useTechLocation';
import type { WinOrder, OrderWorkflowStatus } from '../types/order.types';

const STEPS: { key: OrderWorkflowStatus; label: string }[] = [
  { key: 'AGENDADA', label: 'Agendada' },
  { key: 'EN CAMINO', label: 'En Camino' },
  { key: 'EN PROCESO', label: 'En Proceso' },
  { key: 'FINALIZADO', label: 'Finalizado' },
];

export const OrderDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ordenIdNum = Number(id);
  const { coords } = useTechLocation(ordenIdNum);
  const [order, setOrder] = useState<WinOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    ordersService.fetchMyOrders().then((list) => {
      const found = list.find((o) => o.OrdenId === ordenIdNum);
      if (found) setOrder(found);
    });
  }, [ordenIdNum]);

  if (!order) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Cargando información de la orden...</div>;
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === order.EstadoOT);

  const handleAdvanceStatus = async (nextStatus: OrderWorkflowStatus) => {
    setUpdatingStatus(true);
    try {
      const geo = coords ? `${coords.lat},${coords.lng}` : order.Georeferencia;
      await ordersService.updateOrderStatus(order.OrdenId, nextStatus, geo);
      setOrder({ ...order, EstadoOT: nextStatus });

      // Cuando pasa a EN PROCESO, abre la Página 2 exclusiva de ejecución de tareas
      if (nextStatus === 'EN PROCESO') {
        navigate(`/orders/${order.OrdenId}/work`);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-[#FF5500] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Mis Órdenes
      </button>

      {/* Tarjeta de Estado y Botón de Acción Principal */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Estado de Asignación
          </span>
          <span className="text-xs font-extrabold text-[#FF5500]">{order.EstadoOT}</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {STEPS.map((step, idx) => {
            const done = idx <= currentStepIndex;
            return (
              <div key={step.key} className="space-y-1 text-center">
                <div className={`h-1.5 rounded-full ${done ? 'bg-[#FF5500]' : 'bg-slate-100'}`} />
                <p className={`text-[10px] font-extrabold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {order.EstadoOT === 'AGENDADA' && (
          <button
            onClick={() => handleAdvanceStatus('EN CAMINO')}
            disabled={updatingStatus}
            className="mt-4 w-full py-3 px-4 rounded-xl bg-[#FF5500] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#FF5500]/20 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            {updatingStatus ? 'Actualizando...' : 'Ir en Camino al Domicilio'}
          </button>
        )}

        {order.EstadoOT === 'EN CAMINO' && (
          <button
            onClick={() => handleAdvanceStatus('EN PROCESO')}
            disabled={updatingStatus}
            className="mt-4 w-full py-3 px-4 rounded-xl bg-[#FF5500] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#FF5500]/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            {updatingStatus ? 'Abriendo tareas...' : 'Llegué al Sitio • Iniciar Trabajo'}
          </button>
        )}

        {order.EstadoOT === 'EN PROCESO' && (
          <button
            onClick={() => navigate(`/orders/${order.OrdenId}/work`)}
            className="mt-4 w-full py-3 px-4 rounded-xl bg-[#FF5500] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#FF5500]/20 cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            Continuar Completando Tareas y Fotos →
          </button>
        )}

        {order.EstadoOT === 'FINALIZADO' && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Orden Finalizada
          </div>
        )}
      </div>

      {/* Información Completa del Cliente y Servicio */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#FF5500] bg-[#FFF1E6] px-2.5 py-1 rounded-lg">
            OT #{order.OrdenId} • {order.TipoOrden}
          </span>
          <span className="text-xs font-bold text-slate-400">Servicio: {order.IdenServi}</span>
        </div>

        <div>
          <h2 className="text-base font-extrabold text-slate-900">{order.Cliente}</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Doc: <strong className="text-slate-800">{order.NumeroDocumentoCliente}</strong> • Plan:{' '}
            <strong className="text-slate-800">{order.Producto}</strong>
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs font-semibold text-slate-600">
          <p className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
            <span>{order.Direccion} ({order.Localidad})</span>
          </p>
          {order.ObservacionesOT && (
            <p className="flex items-start gap-2 text-slate-500">
              <FileText className="w-3.5 h-3.5 text-[#FF5500] shrink-0 mt-0.5" />
              <span>{order.ObservacionesOT}</span>
            </p>
          )}
        </div>

        <a
          href={`tel:${order.TeleMovilNume}`}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-2"
        >
          <Phone className="w-3.5 h-3.5 text-[#FF5500]" /> Llamar al Cliente ({order.TeleMovilNume})
        </a>
      </div>

      {/* Mapa Interactivo de Domicilio + CTOs */}
      <OrderNetworkMap
        clientName={order.Cliente}
        clientAddress={order.Direccion}
        georeferencia={order.Georeferencia}
        datosTecnicos={order.DatosTecnicos}
        techCoords={coords}
      />
    </div>
  );
};

export default OrderDetailView;
