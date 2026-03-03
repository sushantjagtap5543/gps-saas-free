'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface VehicleMarkerProps {
  map: L.Map;
  vehicle: any;
  onClick?: () => void;
}

export function VehicleMarker({ map, vehicle, onClick }: VehicleMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!vehicle.latitude || !vehicle.longitude) return;

    const isMoving = vehicle.speed > 0;
    const isActive = vehicle.isActive;
    
    const color = isMoving ? '#10b981' : isActive ? '#f59e0b' : '#ef4444';
    const size = isMoving ? 48 : 40;

    const icon = L.divIcon({
      className: 'vehicle-marker-3d',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          position: relative;
        ">
          <!-- Shadow -->
          <div style="
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: ${size * 0.6}px;
            height: ${size * 0.3}px;
            background: rgba(0,0,0,0.3);
            border-radius: 50%;
            filter: blur(4px);
          "></div>
          
          <!-- Marker body -->
          <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, ${color}, ${adjustColor(color, -20)});
            border-radius: 50% 50% 50% 0;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            transform: rotate(${vehicle.heading - 45}deg);
            transition: transform 0.3s ease;
          ">
            <span style="transform: rotate(${-vehicle.heading + 45}deg);">▲</span>
          </div>
          
          <!-- Pulse effect for moving vehicles -->
          ${isMoving ? `
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: ${size + 16}px;
              height: ${size + 16}px;
              border: 2px solid ${color};
              border-radius: 50%;
              animation: pulse 2s infinite;
              opacity: 0.6;
            "></div>
          ` : ''}
        </div>
        
        <style>
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
        </style>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    markerRef.current = L.marker([vehicle.latitude, vehicle.longitude], { icon })
      .addTo(map);

    if (onClick) {
      markerRef.current.on('click', onClick);
    }

    return () => {
      markerRef.current?.remove();
    };
  }, [map, vehicle, onClick]);

  // Update position
  useEffect(() => {
    if (markerRef.current && vehicle.latitude && vehicle.longitude) {
      markerRef.current.setLatLng([vehicle.latitude, vehicle.longitude]);
    }
  }, [vehicle.latitude, vehicle.longitude]);

  return null;
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
