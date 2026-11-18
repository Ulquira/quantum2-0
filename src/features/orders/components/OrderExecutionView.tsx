import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { ordersService } from '../services/ordersStore';
import { DEFAULT_WORKFLOW_TASKS } from '../services/workflowTemplate';
import { OrderStageWizard } from './OrderStageWizard';
import { useTechLocation } from '../../tracking/hooks/useTechLocation';
import type { WinOrder, OrderTaskItem } from '../types/order.types';

export const OrderExecutionView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ordenIdNum = Number(id);
  const { coords } = useTechLocation(ordenIdNum);
  const [order, setOrder] = useState<WinOrder | null>(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ordersService.fetchMyOrders().then((list) => {
      const found = list.find((o) => Number(o.OrdenId) === ordenIdNum);
      if (found) {
        const storageKey = `q2_tasks_${found.OrdenId}`;
        let savedList: OrderTaskItem[] = [];

        if (Array.isArray(found.tasks) && found.tasks.some((t) => t.foto_url || (t.fotos && t.fotos.length > 0))) {
          savedList = found.tasks;
        } else {
          try {
            const savedRaw = sessionStorage.getItem(storageKey);
            savedList = savedRaw ? JSON.parse(savedRaw) : Array.isArray(found.tasks) ? found.tasks : [];
          } catch {
            savedList = Array.isArray(found.tasks) ? found.tasks : [];
          }
        }

        const mergedTasks: OrderTaskItem[] = DEFAULT_WORKFLOW_TASKS.map((templateTask) => {
          const prev = savedList.find(
            (s) => s.id === templateTask.id || s.codigo_tarea === templateTask.codigo_tarea
          );
          if (prev) {
            const fotosArr =
              Array.isArray(prev.fotos) && prev.fotos.length > 0
                ? prev.fotos
                : prev.foto_url
                ? [prev.foto_url]
                : [];
            return {
              ...templateTask,
              valor_ingresado: prev.valor_ingresado || '',
              foto_url: fotosArr[0] || prev.foto_url || null,
              fotos: fotosArr,
              completado: Boolean(prev.completado),
            };
          }
          if (templateTask.codigo_tarea === 'DOC_TITULAR') {
            return { ...templateTask, valor_ingresado: found.NumeroDocumentoCliente || '' };
          }
          return templateTask;
        });

        try {
          sessionStorage.setItem(storageKey, JSON.stringify(mergedTasks));
        } catch {
          // Ignorar QuotaExceededError si las fotos en base64 superan 5MB
        }
        setOrder({ ...found, tasks: mergedTasks });
        setDiagnostico(found.DiagnósticoTécnico || '');
      }
    });
  }, [ordenIdNum]);

  if (!order) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Cargando tareas de la orden...</div>;
  }

  const handleUpdateTask = (taskId: string, changes: Partial<OrderTaskItem>) => {
    setOrder((prevOrder) => {
      if (!prevOrder) return prevOrder;

      const updatedTasks = prevOrder.tasks.map((t) => {
        if (t.id !== taskId) return t;

        const nextFotos =
          changes.fotos !== undefined
            ? changes.fotos
            : Array.isArray(t.fotos) && t.fotos.length > 0
            ? t.fotos
            : t.foto_url
            ? [t.foto_url]
            : [];

        const nextFotoUrl =
          changes.foto_url !== undefined ? changes.foto_url : nextFotos[0] || t.foto_url || null;

        const merged: OrderTaskItem = {
          ...t,
          ...changes,
          fotos: nextFotos,
          foto_url: nextFotoUrl,
        };

        ordersService.updateTask(taskId, {
          ordenId: prevOrder.OrdenId,
          codigo_tarea: merged.codigo_tarea,
          titulo: merged.titulo,
          valor_ingresado: merged.valor_ingresado,
          foto_url: merged.foto_url,
          fotos: merged.fotos,
          completado: merged.completado,
          lat: coords?.lat,
          lng: coords?.lng,
        });

        return merged;
      });

      try {
        sessionStorage.setItem(`q2_tasks_${prevOrder.OrdenId}`, JSON.stringify(updatedTasks));
      } catch {
        // Ignorar límite de cuota de sessionStorage; la BD ya tiene el respaldo
      }

      return { ...prevOrder, tasks: updatedTasks };
    });
  };

  const requiredTasks = order.tasks.filter((t) => !t.optional && !t.conditionalOnEncargado);
  const allRequiredDone = requiredTasks.every((t) => t.completado);

  const handleFinalize = async () => {
    setSaving(true);
    try {
      const geo = coords ? `${coords.lat},${coords.lng}` : order.Georeferencia;
      await ordersService.updateOrderStatus(order.OrdenId, 'FINALIZADO', geo, diagnostico);
      navigate('/orders');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/orders/${order.OrdenId}`)}
          className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-[#FF5500] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Ver Ficha y Mapa CTO
        </button>
        <span className="text-xs font-extrabold text-[#FF5500] bg-[#FFF1E6] px-2.5 py-1 rounded-lg">
          OT #{order.OrdenId}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-xs font-extrabold text-slate-900 truncate">{order.Cliente}</h2>
          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-[#FF5500] shrink-0" /> {order.Direccion}
          </p>
        </div>
      </div>

      <OrderStageWizard
        tasks={order.tasks}
        disabled={false}
        defaultTitularDoc={order.NumeroDocumentoCliente}
        onUpdateTask={handleUpdateTask}
      />

      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-2.5">
        <input
          type="text"
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          placeholder="Nota u observación de cierre (opcional)..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5500]"
        />

        <button
          onClick={handleFinalize}
          disabled={!allRequiredDone || saving}
          className="w-full py-3.5 px-4 rounded-xl bg-[#FF5500] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs cursor-pointer"
        >
          {saving ? 'Finalizando...' : allRequiredDone ? 'Finalizar Orden OT' : 'Completa las 4 etapas para finalizar'}
        </button>
      </div>
    </div>
  );
};

export default OrderExecutionView;
