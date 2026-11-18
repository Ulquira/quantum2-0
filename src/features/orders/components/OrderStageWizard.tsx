import { useState, type ChangeEvent } from 'react';
import { Camera, Check, ChevronRight, Lock, UserCheck, Plus, X, Sparkles, ScanBarcode, Loader2 } from 'lucide-react';
import { extractSmartOcr } from '../services/ocrService';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import type { OrderStageKey, OrderTaskItem } from '../types/order.types';

interface Props {
  tasks: OrderTaskItem[];
  disabled: boolean;
  defaultTitularDoc: string;
  onUpdateTask: (taskId: string, changes: Partial<OrderTaskItem>) => void;
}

const STAGES: { key: OrderStageKey; label: string }[] = [
  { key: 'CLIENTE', label: '1. Cliente' },
  { key: 'CTO', label: '2. CTO' },
  { key: 'EXTERIOR', label: '3. Exterior' },
  { key: 'EQUIPOS', label: '4. Equipos' },
];

// Comprime la imagen a máx 1280px JPEG (evita que pese 8MB y acelera el OCR y guardado)
const compressImageFile = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(ev.target?.result as string);
        }
      };
      img.onerror = () => resolve(ev.target?.result as string);
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

export const OrderStageWizard = ({ tasks, disabled, defaultTitularDoc, onUpdateTask }: Props) => {
  const [activeStage, setActiveStage] = useState<OrderStageKey>('CLIENTE');
  const [attendant, setAttendant] = useState<'TITULAR' | 'ENCARGADO'>('TITULAR');
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [ocrLoadingId, setOcrLoadingId] = useState<string | null>(null);
  const [barcodeTask, setBarcodeTask] = useState<OrderTaskItem | null>(null);

  const getPhotos = (t: OrderTaskItem): string[] => {
    if (Array.isArray(t.fotos) && t.fotos.length > 0) return t.fotos;
    if (t.foto_url) return [t.foto_url];
    return [];
  };

  const isTaskDone = (t: OrderTaskItem): boolean => {
    if (t.optional) return true;
    if (t.conditionalOnEncargado && attendant === 'TITULAR') return true;
    const needsText = Boolean(t.inputPlaceholder);
    const hasText = !needsText || t.valor_ingresado.trim().length > 0;
    return hasText && getPhotos(t).length > 0;
  };

  const isStageComplete = (stage: OrderStageKey): boolean =>
    tasks.filter((t) => t.stage === stage).every(isTaskDone);

  const stage1Done = isStageComplete('CLIENTE');
  const stage2Done = isStageComplete('CTO');
  const stage3Done = isStageComplete('EXTERIOR');

  const canOpenStage = (stage: OrderStageKey): boolean => {
    if (stage === 'CLIENTE') return true;
    if (stage === 'CTO') return stage1Done;
    if (stage === 'EXTERIOR') return stage1Done && stage2Done;
    return stage1Done && stage2Done && stage3Done;
  };

  const runOcrOnImage = async (task: OrderTaskItem, imageBase64: string, currentPhotos: string[]) => {
    if (!task.scanMode || task.scanMode === 'BARCODE') return;
    setOcrLoadingId(task.id);
    try {
      const detectedText = await extractSmartOcr(imageBase64, task.scanMode);
      if (detectedText) {
        onUpdateTask(task.id, {
          fotos: currentPhotos,
          foto_url: currentPhotos[0] || null,
          valor_ingresado: detectedText,
          completado: currentPhotos.length > 0,
        });
      }
    } finally {
      setOcrLoadingId(null);
    }
  };

  const handleAddPhotos = (task: OrderTaskItem, e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    Promise.all(files.map(compressImageFile)).then(async (newBase64List) => {
      const currentPhotos = getPhotos(task);
      const updatedPhotos = [...currentPhotos, ...newBase64List];
      const val = task.valor_ingresado || (task.codigo_tarea === 'DOC_TITULAR' ? defaultTitularDoc : '');
      const needsText = Boolean(task.inputPlaceholder);
      const completado = (!needsText || val.trim().length > 0) && updatedPhotos.length > 0;

      onUpdateTask(task.id, {
        fotos: updatedPhotos,
        foto_url: updatedPhotos[0] || null,
        valor_ingresado: val,
        completado,
      });
      e.target.value = '';

      if (task.scanMode && task.scanMode !== 'BARCODE') {
        await runOcrOnImage(task, newBase64List[0], updatedPhotos);
      }
    });
  };

  const handleRemovePhoto = (task: OrderTaskItem, indexToRemove: number) => {
    const updatedPhotos = getPhotos(task).filter((_, idx) => idx !== indexToRemove);
    const needsText = Boolean(task.inputPlaceholder);
    const completado = (!needsText || task.valor_ingresado.trim().length > 0) && updatedPhotos.length > 0;

    onUpdateTask(task.id, {
      fotos: updatedPhotos,
      foto_url: updatedPhotos[0] || null,
      completado,
    });
  };

  const handleText = (task: OrderTaskItem, valor_ingresado: string) => {
    const photos = getPhotos(task);
    const completado = valor_ingresado.trim().length > 0 && photos.length > 0;
    onUpdateTask(task.id, {
      fotos: photos,
      foto_url: photos[0] || null,
      valor_ingresado,
      completado,
    });
  };

  const visibleTasks = tasks.filter((t) => {
    if (t.stage !== activeStage) return false;
    if (t.conditionalOnEncargado && attendant === 'TITULAR') return false;
    return true;
  });

  return (
    <div className="space-y-2.5">
      {/* Pestañas de Etapas */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl">
        {STAGES.map((s) => {
          const unlocked = canOpenStage(s.key);
          const done = isStageComplete(s.key);
          const active = activeStage === s.key;
          return (
            <button
              key={s.key}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && setActiveStage(s.key)}
              className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                active
                  ? 'bg-white text-[#FF5500] shadow-xs'
                  : done
                  ? 'text-emerald-600'
                  : unlocked
                  ? 'text-slate-600'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              {!unlocked ? <Lock className="w-3 h-3" /> : done ? <Check className="w-3 h-3 stroke-[3]" /> : null}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className={disabled ? 'opacity-50 pointer-events-none space-y-2' : 'space-y-2'}>
        {activeStage === 'CLIENTE' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#FF5500]" /> ¿Quién atiende?
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-xl">
              {(['TITULAR', 'ENCARGADO'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setAttendant(role)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                    attendant === role ? 'bg-[#FF5500] text-white' : 'text-slate-500'
                  }`}
                >
                  {role === 'TITULAR' ? 'Titular' : 'Encargado'}
                </button>
              ))}
            </div>
          </div>
        )}

        {visibleTasks.map((task) => {
          const photos = getPhotos(task);
          const done = isTaskDone(task) && (photos.length > 0 || task.optional);
          const isOcrRunning = ocrLoadingId === task.id;

          return (
            <div
              key={task.id}
              className={`bg-white border rounded-2xl p-3 transition-colors space-y-2 ${
                done && photos.length > 0 ? 'border-[#FF5500]' : 'border-slate-100'
              }`}
            >
              {/* Fila compacta: Título + Botón Cámara a la derecha + Check */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 truncate">{task.titulo}</span>
                  {task.scanMode && task.scanMode !== 'BARCODE' && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#FFF1E6] text-[#FF5500] shrink-0">
                      <Sparkles className="w-2.5 h-2.5" /> OCR
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <label
                    title="Tomar o subir foto"
                    className="h-8 px-2.5 rounded-xl bg-[#FFF1E6] text-[#FF5500] hover:bg-[#FF5500] hover:text-white transition-colors flex items-center justify-center gap-1 text-[11px] font-extrabold cursor-pointer active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {photos.length > 0 && <span>{photos.length}</span>}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={(e) => handleAddPhotos(task, e)}
                      className="hidden"
                    />
                  </label>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      done && photos.length > 0 ? 'bg-[#FF5500] text-white' : 'bg-slate-100 text-slate-300'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Input compacto (solo cuando la tarea requiere valor) */}
              {task.inputPlaceholder && (
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={task.valor_ingresado}
                      onChange={(e) => handleText(task, e.target.value)}
                      placeholder={isOcrRunning ? 'Leyendo OCR...' : task.inputPlaceholder}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5500] focus:bg-white"
                    />
                    {isOcrRunning && (
                      <Loader2 className="w-3.5 h-3.5 text-[#FF5500] animate-spin absolute right-2.5 top-2" />
                    )}
                  </div>

                  {task.scanMode === 'BARCODE' && (
                    <button
                      type="button"
                      onClick={() => setBarcodeTask(task)}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                    >
                      <ScanBarcode className="w-3.5 h-3.5 text-[#FF5500]" />
                      Escanear
                    </button>
                  )}

                  {task.scanMode && task.scanMode !== 'BARCODE' && photos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => runOcrOnImage(task, photos[photos.length - 1], photos)}
                      title="Re-leer OCR"
                      className="p-1.5 rounded-xl bg-[#FFF1E6] text-[#FF5500] shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Carrusel inferior: solo aparece cuando ya hay fotos */}
              {photos.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 snap-x">
                  {photos.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#FF5500] shrink-0 snap-start"
                    >
                      <img
                        src={imgUrl}
                        alt={`${task.titulo} ${idx + 1}`}
                        onClick={() => setPreviewImg(imgUrl)}
                        className="w-full h-full object-cover cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(task, idx)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  <label className="w-14 h-14 rounded-xl border border-dashed border-[#FF5500]/50 bg-[#FFF1E6]/50 text-[#FF5500] flex items-center justify-center shrink-0 cursor-pointer active:scale-95">
                    <Plus className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={(e) => handleAddPhotos(task, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}

        {activeStage === 'CLIENTE' && stage1Done && (
          <button
            type="button"
            onClick={() => setActiveStage('CTO')}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            Continuar a 2. CTO <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {activeStage === 'CTO' && stage2Done && (
          <button
            type="button"
            onClick={() => setActiveStage('EXTERIOR')}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            Continuar a 3. Exterior <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {activeStage === 'EXTERIOR' && stage3Done && (
          <button
            type="button"
            onClick={() => setActiveStage('EQUIPOS')}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            Continuar a 4. Equipos <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {barcodeTask && (
        <BarcodeScannerModal
          title={barcodeTask.titulo}
          onClose={() => setBarcodeTask(null)}
          onDetected={(code) => {
            const photos = getPhotos(barcodeTask);
            onUpdateTask(barcodeTask.id, {
              fotos: photos,
              foto_url: photos[0] || null,
              valor_ingresado: code,
              completado: photos.length > 0,
            });
            setBarcodeTask(null);
          }}
        />
      )}

      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <div className="relative max-w-sm w-full">
            <img src={previewImg} alt="Vista previa" className="w-full rounded-2xl shadow-2xl" />
            <button
              type="button"
              onClick={() => setPreviewImg(null)}
              className="mt-3 w-full py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs cursor-pointer"
            >
              Cerrar vista previa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
