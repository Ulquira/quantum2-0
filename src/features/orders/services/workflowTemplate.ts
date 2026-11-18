import type { OrderTaskItem } from '../types/order.types';

export const DEFAULT_WORKFLOW_TASKS: OrderTaskItem[] = [
  // ETAPA 1: VALIDACIÓN CLIENTE
  { id: 'c1', stage: 'CLIENTE', codigo_tarea: 'FACHADA', titulo: 'Fachada del Domicilio', valor_ingresado: 'OK', foto_url: null, completado: false },
  { id: 'c2', stage: 'CLIENTE', codigo_tarea: 'DOC_TITULAR', titulo: 'Documento del Titular', inputPlaceholder: 'N° Documento Titular (Auto-OCR)', scanMode: 'OCR_DOC', valor_ingresado: '', foto_url: null, completado: false },
  { id: 'c3', stage: 'CLIENTE', codigo_tarea: 'DOC_ENCARGADO', titulo: 'Documento del Encargado', inputPlaceholder: 'N° Documento Encargado (Auto-OCR)', scanMode: 'OCR_DOC', conditionalOnEncargado: true, valor_ingresado: '', foto_url: null, completado: false },

  // ETAPA 2: PLANTA EXTERNA (CTO)
  { id: 'cto1', stage: 'CTO', codigo_tarea: 'CTO_CERRADA', titulo: 'CTO Cerrada (Nomenclatura)', inputPlaceholder: 'Código CTO (ej. SB-14-08)', scanMode: 'OCR_CTO', valor_ingresado: '', foto_url: null, completado: false },
  { id: 'cto2', stage: 'CTO', codigo_tarea: 'CTO_ABIERTA', titulo: 'CTO Abierta (Sin manipular)', valor_ingresado: 'OK', foto_url: null, completado: false },
  { id: 'cto3', stage: 'CTO', codigo_tarea: 'POTENCIA_PUERTO', titulo: 'Puerto con Power Meter', inputPlaceholder: 'Potencia en dBm (ej. -18.5 dBm)', scanMode: 'OCR_POTENCIA', valor_ingresado: '', foto_url: null, completado: false },
  { id: 'cto4', stage: 'CTO', codigo_tarea: 'CTO_CONECTADA', titulo: 'CTO con Cliente Conectado', valor_ingresado: 'OK', foto_url: null, completado: false },
  { id: 'cto5', stage: 'CTO', codigo_tarea: 'CINTILLO_ID', titulo: 'Cintillo de Identificación', inputPlaceholder: 'Código cintillo (Auto-OCR)', scanMode: 'OCR_CTO', valor_ingresado: '', foto_url: null, completado: false },

  // ETAPA 3: TENDIDO EXTERIOR
  { id: 'ext1', stage: 'EXTERIOR', codigo_tarea: 'RESERVA_EXT', titulo: 'Reserva fuera de CTO', valor_ingresado: 'OK', foto_url: null, completado: false },
  { id: 'ext2', stage: 'EXTERIOR', codigo_tarea: 'ANCLAJE_DOM', titulo: 'Anclaje de Ingreso a Domicilio', valor_ingresado: 'OK', foto_url: null, completado: false },
  { id: 'ext3', stage: 'EXTERIOR', codigo_tarea: 'FOTO_ADICIONAL', titulo: 'Foto Adicional (Opcional)', inputPlaceholder: 'Nota opcional', optional: true, valor_ingresado: '', foto_url: null, completado: false },

  // ETAPA 4: EQUIPOS (ESCÁNER DE CÓDIGO DE BARRAS)
  { id: 'eq1', stage: 'EQUIPOS', codigo_tarea: 'SERIE_ONT', titulo: 'Equipo ONT / Router Principal', inputPlaceholder: 'Serie SN / MAC de ONT', scanMode: 'BARCODE', valor_ingresado: '', foto_url: null, completado: false },
  { id: 'eq2', stage: 'EQUIPOS', codigo_tarea: 'SERIE_MESH', titulo: 'Nodo Mesh (Opcional)', inputPlaceholder: 'Serie SN de Mesh', scanMode: 'BARCODE', optional: true, valor_ingresado: '', foto_url: null, completado: false },
  { id: 'eq3', stage: 'EQUIPOS', codigo_tarea: 'SERIE_FONO', titulo: 'Teléfono / VoIP (Opcional)', inputPlaceholder: 'Serie de Teléfono', scanMode: 'BARCODE', optional: true, valor_ingresado: '', foto_url: null, completado: false },
];
