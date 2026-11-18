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

export const OrderNetworkMap = ({
  clientName,
  clientAddress,
  georeferencia,
  datosTecnicos,
  techCoords,
}: Props) => {
  const [mapStyle, setMapStyle] = useState<'STREETS' | 'SATELLITE'>('STREETS');

  const [rawLat, rawLng] = (georeferencia || '-12.0971,-77.0265')
    .split(',')
    .map((n) => parseFloat(n.trim()));

  const houseLat = Number.isFinite(rawLat) ? rawLat : -12.0971;
  const houseLng = Number.isFinite(rawLng) ? rawLng : -77.0265;

  const ctoMatch = datosTecnicos.match(/CTO:\s*([^\s|]+)/i);
  const portMatch = datosTecnicos.match(/Puerto:\s*([^\s|]+)/i);
  const threadMatch = datosTecnicos.match(/Hilo:\s*([^\s|]+)/i);
  const ctoCoordMatch = datosTecnicos.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);

  const primaryCtoCode = ctoMatch ? ctoMatch[1] : 'CTO-WIN-01';
  const primaryPort = portMatch ? portMatch[1] : '2';
  const primaryThread = threadMatch ? threadMatch[1] : 'Azul';

  const cto1Lat = ctoCoordMatch ? parseFloat(ctoCoordMatch[1]) : Number((houseLat + 0.00035).toFixed(6));
  const cto1Lng = ctoCoordMatch ? parseFloat(ctoCoordMatch[2]) : Number((houseLng - 0.00032).toFixed(6));

  const cto2Lat = Number((houseLat - 0.00038).toFixed(6));
  const cto2Lng = Number((houseLng + 0.00042).toFixed(6));

  const ctoList: CtoPoint[] = [
    {
      id: 'cto-main',
      code: primaryCtoCode,
      port: primaryPort,
      thread: primaryThread,
      lat: cto1Lat,
      lng: cto1Lng,
      distanceMeters: getMeters(houseLat, houseLng, cto1Lat, cto1Lng),
      isPrimary: true,
    },
    {
      id: 'cto-alt',
      code: `${primaryCtoCode}-AUX`,
      port: '6 (Libre)',
      thread: 'Verde',
      lat: cto2Lat,
      lng: cto2Lng,
      distanceMeters: getMeters(houseLat, houseLng, cto2Lat, cto2Lng),
      isPrimary: false,
    },
  ];

  const [selectedCto, setSelectedCto] = useState<CtoPoint>(ctoList[0]);

  // lyrs=m (Google Maps Calles Limpio) | lyrs=y (Google Satélite con nombres de calles)
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
            Toca un marcador para ver puerto y ubicación exacta
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
          <TileLayer
            key={mapStyle}
            attribution='&copy; Google Maps'
            url={googleTileUrl}
            maxZoom={20}
          />

          {/* Marcador Cliente */}
          <Marker
            position={[houseLat, houseLng]}
            icon={createBadgeIcon('#FF5500', '🏠 CLIENTE')}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-slate-900">{clientName}</p>
                <p className="text-slate-600">{clientAddress}</p>
                <p className="text-[10px] text-slate-400">{houseLat}, {houseLng}</p>
              </div>
            </Popup>
          </Marker>

          {/* Marcadores CTO */}
          {ctoList.map((cto) => (
            <Marker
              key={cto.id}
              position={[cto.lat, cto.lng]}
              icon={createBadgeIcon(
                cto.isPrimary ? '#0F172A' : '#475569',
                `⚡ ${cto.code}`
              )}
              eventHandlers={{
                click: () => setSelectedCto(cto),
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-slate-900">
                    CTO: {cto.code} {cto.isPrimary ? '(Asignada)' : '(Alterna)'}
                  </p>
                  <p className="text-slate-600">
                    Puerto: <strong>{cto.port}</strong> • Hilo: <strong>{cto.thread}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400">{cto.lat}, {cto.lng}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marcador Técnico */}
          {techCoords && (
            <Marker
              position={[techCoords.lat, techCoords.lng]}
              icon={createBadgeIcon('#10B981', '📍 TÚ')}
            />
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
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
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
