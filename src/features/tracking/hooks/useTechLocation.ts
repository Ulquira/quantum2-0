import { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { apiClient } from '../../../lib/apiClient';
import { secureStorage } from '../../../utils/storage';

export interface TechCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: string;
}

const MIN_DISTANCE_METERS = 15;
const HEARTBEAT_MS = 30000;

const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const useTechLocation = (activeOrderId?: number) => {
  const [coords, setCoords] = useState<TechCoordinates | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    let watchId: string | null = null;
    let isMounted = true;

    const sendTelemetryToMySQL = async (lat: number, lng: number, accuracy: number) => {
      try {
        const user = await secureStorage.getUser();
        if (!user) return;

        const now = Date.now();
        const prev = lastSentRef.current;

        const movedEnough =
          !prev || getDistanceMeters(prev.lat, prev.lng, lat, lng) >= MIN_DISTANCE_METERS;
        const timeElapsed = !prev || now - prev.time >= HEARTBEAT_MS;

        if (!movedEnough && !timeElapsed) return;

        lastSentRef.current = { lat, lng, time: now };

        await apiClient.post('/tracking', {
          documento: user.documentNumber,
          ordenId: activeOrderId || null,
          lat,
          lng,
          accuracy,
        });
      } catch {
        // Guarda en cola local si el técnico pierde señal momentáneamente
        const queue = JSON.parse(localStorage.getItem('gps_offline_queue') || '[]');
        queue.push({ lat, lng, accuracy, timestamp: new Date().toISOString() });
        localStorage.setItem('gps_offline_queue', JSON.stringify(queue.slice(-50)));
      }
    };

    const startContinuousTracking = async () => {
      try {
        watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          },
          (position) => {
            if (!isMounted || !position) return;
            const lat = Number(position.coords.latitude.toFixed(6));
            const lng = Number(position.coords.longitude.toFixed(6));
            const accuracy = Math.round(position.coords.accuracy);

            const current: TechCoordinates = {
              lat,
              lng,
              accuracy,
              updatedAt: new Date().toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
            };

            setCoords(current);
            sessionStorage.setItem('last_tech_gps', JSON.stringify(current));
            sendTelemetryToMySQL(lat, lng, accuracy);
          }
        );
      } catch {
        // Fallback automático en entorno de desarrollo PC sin GPS físico
      }
    };

    startContinuousTracking();

    return () => {
      isMounted = false;
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [activeOrderId]);

  return { coords };
};
