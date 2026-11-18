import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Cpu, Home, Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface CtoPoint {
  id: string;
  code: string;
  port: string;
  thread: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  isPrimary: boolean;
}

interface Props {
  clientName: string;
  clientAddress: string;
  georeferencia: string;
  datosTecnicos: string;
  techCoords?: { lat: number; lng: number } | null;
}

const createBadgeIcon = (bg: string, label: string) =>
  L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background:${bg};color:#fff;font-weight:800;font-size:10px;padding:4px 9px;border-radius:999px;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.22);white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${label}</div>`,
    iconSize: [78, 26],
    iconAnchor: [39, 13],
  });

const getMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const parsePair = (raw?: string | null): { lat: number; lng: number } | null => {
  if (!raw) return null;
  const m = String(raw).match(/-?\d+\.\d+/g);
  if (!m || m.length < 2) return null;
  const lat = parseFloat(m[0]);
  const lng = parseFloat(m[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

export const OrderNetworkMap = ({
  clientName,
  clientAddress,
  georeferencia,
  datosTecnicos,
  techCoords,
}: Props) => {
  const [mapStyle, setMapStyle] = useState<'STREETS' | 'SATELLITE'>('STREETS');

  const houseCoord = parsePair(georeferencia) || { lat: -12.0971, lng: -77.0265 };
  const houseLat = houseCoord.lat;
  const houseLng = houseCoord.lng;

  // Parsea el formato oficial de vw_winordetraba ("CTO/1/MIR-09;COORDENADA CTO/1/-12.11,-77.03;PUERTO/1/4")
  const ctoNames: Record<string, string> = {};
  const ctoCoords: Record<string, { lat: number; lng: number }> = {};
  let parsedPort = 'Asignado';
  let parsedThread = 'Principal';

  if (datosTecnicos) {
    const segments = String(datosTecnicos).split(';').map((s) => s.trim()).filter(Boolean);
    for (const seg of segments) {
      const parts = seg.split('/');
      const rawKey = (parts[0] || '').trim().toUpperCase();
      const rawVal = (parts.slice(2).join('/') || parts[1] || '').trim();
      if (!rawKey || !rawVal) continue;

      if (/^CTO\d*$/i.test(rawKey)) {
        ctoNames[rawKey] = rawVal;
      } else if (/COORDENADA\s*(CTO\d*)/i.test(rawKey)) {
        const m = rawKey.match(/(CTO\d*)/i);
        const key = m ? m[1].toUpperCase() : 'CTO';
        const c = parsePair(rawVal);
        if (c) ctoCoords[key] = c;
      } else if (rawKey.includes('PUERTO') || rawKey.includes('BORNE')) {
        parsedPort = rawVal;
      } else if (rawKey.includes('HILO') || rawKey.includes('BUFFER')) {
        parsedThread = rawVal;
      }
    }
  }

  const ctoList: CtoPoint[] = [];
  const keys = Array.from(new Set([...Object.keys(ctoNames), ...Object.keys(ctoCoords)]));

  keys.forEach((k, idx) => {
    const coord = ctoCoords[k] || {
      lat: Number((houseLat + (idx === 0 ? 0.00032 : -0.00035)).toFixed(6)),
      lng: Number((houseLng + (idx === 0 ? -0.00028 : 0.00038)).toFixed(6)),
    };
    ctoList.push({
      id: `cto-${k}-${idx}`,
      code: ctoNames[k] || k,
      port: parsedPort,
      thread: parsedThread,
      lat: coord.lat,
      lng: coord.lng,
      distanceMeters: getMeters(houseLat, houseLng, coord.lat, coord.lng),
      isPrimary: idx === 0,
    });
  });

  if (ctoList.length === 0) {
    const ctoMatch = datosTecnicos.match(/CTO:\s*([^\s|;]+)/i);
    const portMatch = datosTecnicos.match(/Puerto:\s*([^\s|;]+)/i);
    const threadMatch = datosTecnicos.match(/Hilo:\s*([^\s|;]+)/i);
    const c1Lat = Number((houseLat + 0.00032).toFixed(6));
    const c1Lng = Number((houseLng - 0.00028).toFixed(6));
    ctoList.push({
      id: 'cto-main',
      code: ctoMatch ? ctoMatch[1] : 'CTO-ASIGNADA',
      port: portMatch ? portMatch[1] : parsedPort,
      thread: threadMatch ? threadMatch[1] : parsedThread,
      lat: c1Lat,
      lng: c1Lng,
      distanceMeters: getMeters(houseLat, houseLng, c1Lat, c1Lng),
      isPrimary: true,
    });
  }

  const [selectedCto, setSelectedCto] = useState<CtoPoint>(ctoList[0]);

  const googleTileUrl =
    mapStyle === 'STREETS'
      ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es'
      : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=es';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900">Google Maps • Cliente y CTO</h3>
          <p className="text-[11px] font-semibold text-slate-400">
            Ubicación exacta desde Datos Técnicos
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMapStyle((prev) => (prev === 'STREETS' ? 'SATELLITE' : 'STREETS'))}
          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
        >
          <Layers className="w-3 h-3 text-[#FF5500]" />
          {mapStyle === 'STREETS' ? 'Ver Satélite' : 'Ver Mapa'}
        </button>
      </div>

      <div className="h-64 w-full relative">
        <MapContainer
          center={[houseLat, houseLng]}
          zoom={18}
          scrollWheelZoom={true}
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer key={mapStyle} attribution="&copy; Google Maps" url={googleTileUrl} maxZoom={20} />

          <Marker position={[houseLat, houseLng]} icon={createBadgeIcon('#FF5500', '🏠 CLIENTE')}>
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-slate-900">{clientName}</p>
                <p className="text-slate-600">{clientAddress}</p>
                <p className="text-[10px] text-slate-400">{houseLat}, {houseLng}</p>
              </div>
            </Popup>
          </Marker>

          {ctoList.map((cto) => (
            <Marker
              key={cto.id}
              position={[cto.lat, cto.lng]}
              icon={createBadgeIcon(cto.isPrimary ? '#0F172A' : '#475569', `⚡ ${cto.code}`)}
              eventHandlers={{ click: () => setSelectedCto(cto) }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-slate-900">CTO: {cto.code}</p>
                  <p className="text-[10px] text-slate-400">{cto.lat}, {cto.lng}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {techCoords && (
            <Marker position={[techCoords.lat, techCoords.lng]} icon={createBadgeIcon('#10B981', '📍 TÚ')} />
          )}
        </MapContainer>
      </div>

      <div className="p-3.5 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto">
          {ctoList.map((cto) => {
            const active = selectedCto.id === cto.id;
            return (
              <button
                key={cto.id}
                type="button"
                onClick={() => setSelectedCto(cto)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  active ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>{cto.code}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-slate-900">
              CTO {selectedCto.code} {selectedCto.isPrimary ? '• Principal' : '• Alterna'}
            </p>
            <span className="text-[11px] font-extrabold text-[#FF5500] bg-[#FFF1E6] px-2.5 py-0.5 rounded-full">
              A ~{selectedCto.distanceMeters}m del cliente
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">PUERTO ASIGNADO</span>
              <span className="font-extrabold text-slate-900">{selectedCto.port}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">HILO / BUFFER</span>
              <span className="font-extrabold text-slate-900">{selectedCto.thread}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${houseLat},${houseLng}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#FFF1E6] text-[#FF5500] text-xs font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Ir a Casa</span>
            </a>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedCto.lat},${selectedCto.lng}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#FF5500] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs shadow-[#FF5500]/20"
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>Ir a CTO</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderNetworkMap;
