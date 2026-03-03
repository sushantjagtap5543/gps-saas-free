'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Car } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LiveMapProps {
  vehicles: any[];
  selectedVehicle?: any;
  onVehicleSelect?: (vehicle: any) => void;
  layer?: 'streets' | 'satellite';
}

function MapController({ selectedVehicle }: { selectedVehicle?: any }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedVehicle?.latitude) {
      map.setView(
        [selectedVehicle.latitude, selectedVehicle.longitude],
        16,
        { animate: true }
      );
    }
  }, [selectedVehicle, map]);
  
  return null;
}

function createVehicleIcon(heading: number, isMoving: boolean) {
  const svgString = renderToString(
    <div style={{ 
      transform: `rotate(${heading}deg)`,
      transition: 'transform 0.3s ease'
    }}>
      <Car 
        className={isMoving ? 'text-emerald-500' : 'text-amber-500'} 
        style={{ width: 24, height: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      />
    </div>
  );
  
  return L.divIcon({
    html: svgString,
    className: 'vehicle-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function LiveMap({ vehicles, selectedVehicle, onVehicleSelect, layer = 'streets' }: LiveMapProps) {
  const defaultCenter = selectedVehicle?.latitude 
    ? [selectedVehicle.latitude, selectedVehicle.longitude]
    : [19.0760, 72.8777]; // Mumbai default

  const tileUrl = layer === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <MapContainer
      center={defaultCenter as [number, number]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={tileUrl}
      />
      
      <MapController selectedVehicle={selectedVehicle} />
      
      {vehicles.map((vehicle) => (
        vehicle.latitude && (
          <Marker
            key={vehicle.id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={createVehicleIcon(vehicle.heading || 0, vehicle.speed > 0)}
            eventHandlers={{
              click: () => onVehicleSelect?.(vehicle),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{vehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.plateNumber}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Speed: {vehicle.speed || 0} km/h</p>
                  <p>Updated: {new Date(vehicle.lastPositionAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
