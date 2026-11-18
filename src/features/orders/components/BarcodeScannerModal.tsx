import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanBarcode, Upload } from 'lucide-react';

interface Props {
  title: string;
  onDetected: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal = ({ title, onDetected, onClose }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = 'win-barcode-reader-box';

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(readerId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (decodedText) => {
          html5QrCode.stop().catch(() => {});
          onDetected(decodedText.trim());
        },
        () => {}
      )
      .catch(() => {
        setError('No se detectó cámara activa. Puedes subir una imagen del código de barras abajo.');
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onDetected]);

  const handleScanFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;
    try {
      const result = await scannerRef.current.scanFile(file, true);
      onDetected(result.trim());
    } catch {
      setError('No se logró leer un código de barras nítido en la imagen. Intenta con otra toma.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-[#FF5500]" />
            <h3 className="text-xs font-extrabold text-slate-900">Escanear Serie • {title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div id={readerId} className="w-full rounded-2xl overflow-hidden bg-slate-950 min-h-[190px]" />

        {error && (
          <p className="text-[11px] font-semibold text-amber-600 bg-amber-50 p-2.5 rounded-xl text-center">
            {error}
          </p>
        )}

        <label className="w-full py-2.5 px-3 rounded-xl bg-[#FFF1E6] text-[#FF5500] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4" />
          Escanear desde foto de etiqueta
          <input type="file" accept="image/*" onChange={handleScanFromFile} className="hidden" />
        </label>
      </div>
    </div>
  );
};
