'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { cn } from '@/lib/utils'

interface VehicleMarkerProps {
  map: L.Map
  position: [number, number]
  heading: number
  status: 'moving' | 'stopped' | 'offline'
  name: string
  speed: number
  onClick?: () => void
}

export function VehicleMarker({ map, position, heading, status, name, speed, onClick }: VehicleMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!map) return

    const color = status === 'moving' ? '#22c55e' : status === 'stopped' ? '#eab308' : '#6b7280'
    
    // Create custom icon
    const iconHtml = `
      <div class="relative">
        <div class="absolute inset-0 rounded-full animate-ping opacity-25" style="background-color: ${color}"></div>
        <div class="relative w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-xs" 
             style="background: linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%); transform: rotate(${heading}deg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(-${heading}deg);">
            <path d="M12 2L12 8M12 22L12 16M2 12L8 12M22 12L16 12" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/75 text-white text-xs px-2 py-1 rounded-full">
          ${name}
        </div>
      </div>
    `

    const icon = L.divIcon({
      html: iconHtml,
      className: 'custom-marker-icon',
      iconSize: [40, 50],
      iconAnchor: [20, 25],
    })

    markerRef.current = L.marker(position, { icon }).addTo(map)

    if (onClick) {
      markerRef.current.on('click', onClick)
    }

    return () => {
      markerRef.current?.remove()
    }
  }, [map, position, heading, status, name, onClick])

  // Update position without recreating marker
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position)
    }
  }, [position])

  return null
}

function adjustColor(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}
