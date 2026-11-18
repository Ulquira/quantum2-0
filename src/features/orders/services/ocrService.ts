import Tesseract from 'tesseract.js';
import type { SmartScanMode } from '../types/order.types';

export const extractSmartOcr = async (
  imageBase64: string,
  mode: SmartScanMode
): Promise<string | null> => {
  try {
    const { data } = await Tesseract.recognize(imageBase64, 'eng');
    const raw = (data.text || '').toUpperCase();

    if (mode === 'OCR_POTENCIA') {
      // Detecta lecturas de Power Meter óptico como -18.45, -19.2 dBm, -21,4
      const match = raw.match(/-\s*\d{2}[.,]\d{1,2}/) || raw.match(/\d{2}[.,]\d{1,2}\s*DBM/i);
      if (match) {
        const clean = match[0].replace(/\s+/g, '').replace(',', '.').replace(/DBM/i, '');
        return `${clean.startsWith('-') ? clean : `-${clean}`} dBm`;
      }
    }

    if (mode === 'OCR_DOC') {
      // Detecta DNI (8 dígitos) o Carnet de Extranjería (9-12 dígitos)
      const docMatch = raw.match(/\b\d{8,12}\b/);
      if (docMatch) return docMatch[0];
    }

    if (mode === 'OCR_CTO') {
      // Detecta nomenclaturas tipo SB-14-08, CTO-04, MIR-09-03 o códigos alfanuméricos
      const ctoMatch =
        raw.match(/\b[A-Z]{2,4}[-_ ]?\d{1,3}[-_ ]?\d{1,3}\b/) ||
        raw.match(/\b[A-Z0-9]{4,14}\b/);
      if (ctoMatch) return ctoMatch[0].replace(/\s+/g, '-');
    }

    const firstLine = raw
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length >= 3);
    return firstLine || null;
  } catch {
    return null;
  }
};
