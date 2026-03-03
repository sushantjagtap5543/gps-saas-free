'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { VehicleMarker } from './vehicle-marker'
import { useWebSocket } from '@/hooks/use-websocket'
import { cn } from '@/lib/utils'

interface Vehicle {
  id: string
  name: string
  latitude: number
  longitude: number
  speed: number
  heading: number
  isActive: boolean
  plateNumber?: string
}

interface LiveMapProps {
  vehicles: Vehicle[]
  selectedVehicle?: string | null
  onVehicleSelect?: (id: string) => void
  className?: string
}

function MapController({ vehicles, selectedVehicle }: { vehicles: Vehicle[], selectedVehicle?: string | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (selectedVehicle && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === selectedVehicle)
      if (vehicle) {
        map.flyTo([vehicle.latitude, vehicle.longitude], 16, {
          duration: 1.5
        })
      }
    }
  }, [selectedVehicle, vehicles, map])

  return null
}

export function LiveMap({ vehicles, selectedVehicle, onVehicleSelect, className }: LiveMapProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const { subscribeToVehicle, onVehicleUpdate } = useWebSocket()
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>(vehicles)

  // Subscribe to all vehicles
  useEffect(() => {
    vehicles.forEach(v => subscribeToVehicle(v.id))
  }, [vehicles, subscribeToVehicle])

  // Handle real-time updates
  useEffect(() => {
    const unsubscribe = onVehicleUpdate((data) => {
      setLiveVehicles(prev => prev.map(v => 
        v.id === data.id 
          ? { ...v, ...data }
          : v
      ))
    })
    return unsubscribe
  }, [onVehicleUpdate])

  const getVehicleStatus = (v: Vehicle): 'moving' | 'stopped' | 'offline' => {
    if (!v.isActive) return 'offline'
    if (v.speed > 0) return 'moving'
    return 'stopped'
  }

  return (
    <div className={cn("relative rounded-xl overflow-hidden shadow-2xl", className)}>
      <MapContainer
        center={[19.0760, 72.8777]}
        zoom={12}
        className="h-full w-full"
        whenCreated={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {map && liveVehicles.map((vehicle) => (
          <VehicleMarker
            key={vehicle.id}
            map={map}
            position={[vehicle.latitude, vehicle.longitude]}
            heading={vehicle.heading || 0}
            status={getVehicleStatus(vehicle)}
            name={vehicle.name}
            speed={vehicle.speed}
            onClick={() => onVehicleSelect?.(vehicle.id)}
          />
        ))}
        
        <MapController vehicles={liveVehicles} selectedVehicle={selectedVehicle} />
      </MapContainer>

      {/* Map Overlay Info */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-md rounded-lg p-4 shadow-lg border">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span>{liveVehicles.filter(v => v.speed > 0).length} Moving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>{liveVehicles.filter(v => v.speed === 0 && v.isActive).length} Stopped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>{liveVehicles.filter(v => !v.isActive).length} Offline</span>
          </div>
        </div>
      </div>
    </div>
  )
}
