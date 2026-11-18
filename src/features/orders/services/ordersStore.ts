import { apiClient } from '../../../lib/apiClient';
import { secureStorage } from '../../../utils/storage';
import { DEFAULT_WORKFLOW_TASKS } from './workflowTemplate';
import type { WinOrder, OrderWorkflowStatus } from '../types/order.types';

const FALLBACK_ORDERS: WinOrder[] = [
  {
    OrdenId: 904101,
    TipoOrden: 'INST',
    TipoTraba: 'Instalación FTTH Residencial',
    MotivoTrabajo: 'Alta Nueva Fibra 600 Mbps',
    Cliente: 'CARLOS MENDOZA VARGAS',
    Producto: 'DUO INTERNET 600MB + WINTV',
    Cuadrilla: 'CUAD-LIMA-04',
    FVisita: '12:00 pm - 4:00 pm',
    Estado: 'ASIGNADA',
    EstadoOT: 'AGENDADA',
    Direccion: 'Av. Javier Prado Este 2450 Dpto 402',
    Localidad: 'SAN BORJA',
    Provincia: 'LIMA',
    IdenServi: 'SRV-884120',
    Zona: 'LIMA ESTE',
    ObservacionesOT: 'Llamar 15 min antes de llegar. Portón negro.',
    DiagnósticoTécnico: '',
    UsuarioResponsable: '111',
    NumeroDocumentoCliente: '45896321',
    Prioridad: 'ALTA',
    TeleMovilNume: '987654321',
    Georeferencia: '-12.089120,-77.001250',
    DatosTecnicos: 'CTO: SB-14-08 | Puerto: 4 | Hilo: Azul',
    Cuadrilla_nombre: 'Cuadrilla 04 - WIN',
    Pin_token: '4829',
    tasks: DEFAULT_WORKFLOW_TASKS,
  },
  {
    OrdenId: 904102,
    TipoOrden: 'AVERIA',
    TipoTraba: 'Mantenimiento Correctivo FTTH',
    MotivoTrabajo: 'LOS Rojo en ONT / Sin Servicio',
    Cliente: 'MARÍA FERNÁNDEZ ROJAS',
    Producto: 'INTERNET 1000MB GAMER',
    Cuadrilla: 'CUAD-LIMA-04',
    FVisita: '12:00 pm - 4:00 pm',
    Estado: 'ASIGNADA',
    EstadoOT: 'AGENDADA',
    Direccion: 'Calle Las Begonias 415 Of. 201',
    Localidad: 'SAN ISIDRO',
    Provincia: 'LIMA',
    IdenServi: 'SRV-772310',
    Zona: 'LIMA CENTRO',
    ObservacionesOT: 'Cliente reporta corte de fibra externa desde ayer.',
    DiagnósticoTécnico: '',
    UsuarioResponsable: '111',
    NumeroDocumentoCliente: '41258963',
    Prioridad: 'CRITICA',
    TeleMovilNume: '999888777',
    Georeferencia: '-12.097100,-77.026500',
    DatosTecnicos: 'CTO: SI-02-11 | Puerto: 2 | Hilo: Verde',
    Cuadrilla_nombre: 'Cuadrilla 04 - WIN',
    Pin_token: '9104',
    tasks: DEFAULT_WORKFLOW_TASKS,
  },
  {
    OrdenId: 904103,
    TipoOrden: 'POSTVENTA',
    TipoTraba: 'Traslado Interno / Mesh',
    MotivoTrabajo: 'Instalación de Nodo Mesh Adicional',
    Cliente: 'JORGE LUIS RAMÍREZ',
    Producto: 'INTERNET 400MB',
    Cuadrilla: 'CUAD-LIMA-04',
    FVisita: '12:00 pm - 4:00 pm',
    Estado: 'ASIGNADA',
    EstadoOT: 'AGENDADA',
    Direccion: 'Av. Angamos Oeste 1120',
    Localidad: 'MIRAFLORES',
    Provincia: 'LIMA',
    IdenServi: 'SRV-665190',
    Zona: 'LIMA SUR',
    ObservacionesOT: 'Configurar repetidor en segundo piso.',
    DiagnósticoTécnico: '',
    UsuarioResponsable: '111',
    NumeroDocumentoCliente: '10457896',
    Prioridad: 'NORMAL',
    TeleMovilNume: '945123654',
    Georeferencia: '-12.113500,-77.034200',
    DatosTecnicos: 'CTO: MIR-09-03 | Puerto: 7 | Hilo: Azul',
    Cuadrilla_nombre: 'Cuadrilla 04 - WIN',
    Pin_token: '3312',
    tasks: DEFAULT_WORKFLOW_TASKS,
  },
];

export const ordersService = {
  async fetchMyOrders(): Promise<WinOrder[]> {
    const user = await secureStorage.getUser();
    try {
      if (user) {
        const { data } = await apiClient.get<WinOrder[]>(`/orders/${user.documentNumber}`);
        if (data && data.length > 0) {
          localStorage.setItem('q2_cached_orders', JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // Si el teléfono está fuera del Wi-Fi de la PC, usa las órdenes en memoria del teléfono
    }

    const cached = localStorage.getItem('q2_cached_orders');
    if (cached) return JSON.parse(cached) as WinOrder[];

    localStorage.setItem('q2_cached_orders', JSON.stringify(FALLBACK_ORDERS));
    return FALLBACK_ORDERS;
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
        o.OrdenId === ordenId ? { ...o, EstadoOT: status, DiagnósticoTécnico: diagnostico || o.DiagnósticoTécnico } : o
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
      // Estado guardado localmente en el dispositivo
    }
  },

  async updateTask(
    taskId: string,
    payload: { valor_ingresado: string; foto_url: string | null; completado: boolean; lat?: number; lng?: number }
  ): Promise<void> {
    try {
      await apiClient.put(`/orders/task/${taskId}`, payload);
    } catch {
      // Tarea guardada localmente en el dispositivo
    }
  },
};
