export type OrderWorkflowStatus = 'AGENDADA' | 'EN CAMINO' | 'EN PROCESO' | 'FINALIZADO';
export type OrderStageKey = 'CLIENTE' | 'CTO' | 'EXTERIOR' | 'EQUIPOS';
export type SmartScanMode = 'OCR_DOC' | 'OCR_POTENCIA' | 'OCR_CTO' | 'BARCODE';

export interface WinOrder {
  OrdenId: number;
  TipoOrden: 'INST' | 'AVERIA' | 'POSTVENTA' | string;
  TipoTraba: string;
  MotivoTrabajo: string;
  Cliente: string;
  Producto: string;
  Cuadrilla: string;
  FVisita: string;
  Estado: string;
  EstadoOT: OrderWorkflowStatus;
  Direccion: string;
  Localidad: string;
  Provincia: string;
  IdenServi: string;
  Zona: string;
  ObservacionesOT: string;
  DiagnósticoTécnico: string;
  UsuarioResponsable: string;
  NumeroDocumentoCliente: string;
  Prioridad: 'CRITICA' | 'ALTA' | 'NORMAL';
  TeleMovilNume: string;
  Georeferencia: string;
  DatosTecnicos: string;
  Cuadrilla_nombre: string;
  Georeferencia_tecnico?: string;
  Pin_token: string;
  tasks: OrderTaskItem[];
}

export interface OrderTaskItem {
  id: string;
  stage: OrderStageKey;
  codigo_tarea: string;
  titulo: string;
  inputPlaceholder?: string;
  scanMode?: SmartScanMode;
  optional?: boolean;
  conditionalOnEncargado?: boolean;
  valor_ingresado: string;
  foto_url: string | null;
  fotos?: string[];
  completado: boolean;
}
