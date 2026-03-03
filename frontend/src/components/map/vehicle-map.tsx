'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface VehicleMapProps {
  vehicles: any[];
  height?: string;
}

export function VehicleMap({ vehicles, height = '100%' }: VehicleMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView([19.0760, 72.8777], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const currentIds = new Set<string>();

    vehicles.forEach((vehicle) => {
      if (!vehicle.latitude || !vehicle.longitude) return;

      currentIds.add(vehicle.id);
      const existingMarker = markersRef.current.get(vehicle.id);

      if (existingMarker) {
        existingMarker.setLatLng([vehicle.latitude, vehicle.longitude]);
      } else {
        const color = vehicle.speed > 0 ? '#10b981' : vehicle.isActive ? '#f59e0b' : '#ef4444';
        
        const icon = L.divIcon({
          className: 'custom-vehicle-marker',
          html: `
            <div style="
              width: 40px;
              height: 40px;
              background: ${color};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
              transform: rotate(${vehicle.heading || 0}deg);
            ">
              ▲
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif;">
              <h3 style="margin: 0 0 8px 0;">${vehicle.name}</h3>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                Speed: ${vehicle.speed || 0} km/h
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                Plate: ${vehicle.plateNumber || 'N/A'}
              </p>
            </div>
          `);

        markersRef.current.set(vehicle.id, marker);
      }
    });

    // Remove markers for vehicles no longer present
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Fit bounds if vehicles exist
    if (currentIds.size > 0) {
      const bounds = L.latLngBounds(
        vehicles
          .filter(v => v.latitude && v.longitude)
          .map(v => [v.latitude, v.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vehicles]);

  return (
    <div 
      ref={containerRef} 
      style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}
    />
  );
}
