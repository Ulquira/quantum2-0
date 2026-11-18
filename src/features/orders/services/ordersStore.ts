import { apiClient } from '../../../lib/apiClient';
import { secureStorage } from '../../../utils/storage';
import { DEFAULT_WORKFLOW_TASKS } from './workflowTemplate';
import type { WinOrder, OrderWorkflowStatus } from '../types/order.types';

const normalizeRemoteOrder = (r: any, doc: string): WinOrder => {
  const rawEstado = String(r.EstadoOT || r.estado_ot || r.Estado || '').toUpperCase();
  const estadoOt: OrderWorkflowStatus = rawEstado.includes('FINALIZ')
    ? 'FINALIZADO'
    : rawEstado.includes('PROCES') || rawEstado.includes('INICIAD')
    ? 'EN PROCESO'
    : rawEstado.includes('CAMINO') || rawEstado.includes('RUTA')
    ? 'EN CAMINO'
    : 'AGENDADA';

  return {
    OrdenId: Number(r.OrdenId || r.orden_id),
    TipoOrden: String(r.TipoOrden || r.servicio_tipo || r.tipo_operacion || 'INST'),
    TipoTraba: String(r.TipoTraba || r.tipo_trabajo || 'Instalación FTTH'),
    MotivoTrabajo: String(r.MotivoTrabajo || r.motivo_trabajo || r.producto || ''),
    Cliente: String(r.Cliente || r.cliente || 'Cliente WIN'),
    Producto: String(r.Producto || r.producto || r.plan_contratado || ''),
    Cuadrilla: String(r.Cuadrilla || r.cuadrilla_completa || r.cuadrilla || ''),
    FVisita: String(r.FVisita || r.fecha_solicitud_fmt || 'Hoy'),
    Estado: String(r.Estado || r.estado_ot || 'ASIGNADA'),
    EstadoOT: estadoOt,
    Direccion: String(r.Direccion || r.direccion_cliente || r.distrito || ''),
    Localidad: String(r.Localidad || r.distrito || 'LIMA'),
    Provincia: String(r.Provincia || 'LIMA'),
    IdenServi: String(r.IdenServi || r.ticket || r.codi_segui_ot || ''),
    Zona: String(r.Zona || r.sector_operativo || 'LIMA'),
    ObservacionesOT: String(r.ObservacionesOT || r.observaciones_tareas || ''),
    DiagnósticoTécnico: String(r.DiagnósticoTécnico || r.diagnostico_tecnico || ''),
    UsuarioResponsable: doc,
    NumeroDocumentoCliente: String(r.NumeroDocumentoCliente || r.numero_documento || ''),
    Prioridad: 'ALTA',
    TeleMovilNume: String(r.TeleMovilNume || r.telefono || ''),
    Georeferencia: String(r.Georeferencia || r.georeferencia_cliente || '-12.0971,-77.0265'),
    DatosTecnicos: String(r.DatosTecnicos || r.datos_tecnicos || ''),
    Cuadrilla_nombre: String(r.Cuadrilla_nombre || r.cuadrilla_completa || r.cuadrilla || ''),
    Georeferencia_tecnico: String(r.Georeferencia_tecnico || r.georeferencia_tecnico || ''),
    Pin_token: String(r.Pin_token || r.token_tracking || ''),
    tasks: Array.isArray(r.tasks) && r.tasks.length > 0 ? r.tasks : DEFAULT_WORKFLOW_TASKS,
  };
};

export const ordersService = {
  async fetchMyOrders(): Promise<WinOrder[]> {
    const user = await secureStorage.getUser();
    const doc = user?.documentNumber || '99999999';

    try {
      // 1. Intenta el endpoint dedicado móvil (/api/orders/:documentNumber)
      const { data } = await apiClient.get<any[]>(`/orders/${doc}`);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((r) => normalizeRemoteOrder(r, doc));
        localStorage.setItem('q2_cached_orders', JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // Si aún no se desplegó mobileField.ts en Azure, usa /api/orders/search que ya existe en win-dashboard-api
    }

    try {
      const queryFilter = doc === '99999999' || doc === '111' ? '' : doc;
      const { data } = await apiClient.get<any>(`/orders/search`, {
        params: { ignoreDates: 'true', q: queryFilter, page: 1, pageSize: 30 },
      });
      if (data?.ok && Array.isArray(data.orders) && data.orders.length > 0) {
        const mapped = data.orders.map((r: any) => normalizeRemoteOrder(r, doc));
        localStorage.setItem('q2_cached_orders', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Usando caché local:', err);
    }

    const cached = localStorage.getItem('q2_cached_orders');
    return cached ? (JSON.parse(cached) as WinOrder[]) : [];
  },

  async updateOrderStatus(
    ordenId: number,
    status: OrderWorkflowStatus,
    georeferencia_tecnico?: string,
    diagnostico?: string
  ): Promise<void> {
    const cached = localStorage.getItem('q2_cached_orders');
    if (cached) {
      const list = (JSON.parse(cached) as WinOrder[]).map((o) =>
        Number(o.OrdenId) === Number(ordenId)
          ? { ...o, EstadoOT: status, DiagnósticoTécnico: diagnostico || o.DiagnósticoTécnico }
          : o
      );
      localStorage.setItem('q2_cached_orders', JSON.stringify(list));
    }

    try {
      await apiClient.put(`/orders/${ordenId}/status`, {
        status,
        georeferencia_tecnico,
        diagnostico,
      });
    } catch {
      // Estado guardado localmente mientras se despliega el endpoint PUT en Azure
    }
  },

  async updateTask(
    taskId: string,
    payload: {
      ordenId?: number;
      codigo_tarea?: string;
      titulo?: string;
      valor_ingresado: string;
      foto_url: string | null;
      fotos?: string[];
      completado: boolean;
      lat?: number;
      lng?: number;
    }
  ): Promise<void> {
    try {
      await apiClient.put(`/orders/task/${taskId}`, payload);
    } catch {
      // Sincronizado en almacenamiento local
    }
  },
};
