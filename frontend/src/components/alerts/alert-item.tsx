'use client'

import { formatDate } from '@/lib/utils'
import { AlertTriangle, MapPin, Navigation, Battery, Power } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AlertItemProps {
  alert: {
    id: string
    type: string
    message: string
    severity: string
    isRead: boolean
    createdAt: string
    vehicle?: {
      name: string
      plateNumber?: string
    }
  }
  onClick?: () => void
}

const alertIcons = {
  'IGNITION_ON': Power,
  'IGNITION_OFF': Power,
  'OVERSPEED': Navigation,
  'GEOFENCE_ENTER': MapPin,
  'GEOFENCE_EXIT': MapPin,
  'DEVICE_OFFLINE': AlertTriangle,
  'LOW_BATTERY': Battery,
}

const severityColors = {
  'low': 'bg-blue-500',
  'medium': 'bg-yellow-500',
  'high': 'bg-orange-500',
  'critical': 'bg-red-500',
}

export function AlertItem({ alert, onClick }: AlertItemProps) {
  const Icon = alertIcons[alert.type as keyof typeof alertIcons] || AlertTriangle
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
        alert.isRead ? "bg-muted/50" : "bg-card border-l-4 border-l-primary"
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
        severityColors[alert.severity as keyof typeof severityColors] || 'bg-gray-500',
        "bg-opacity-10"
      )}>
        <Icon className={cn(
          "h-5 w-5",
          severityColors[alert.severity as keyof typeof severityColors] || 'text-gray-500'
        ).replace('bg-', 'text-')} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium truncate">{alert.message}</p>
          {!alert.isRead && (
            <Badge variant="default" className="shrink-0">New</Badge>
          )}
        </div>
        
        {alert.vehicle && (
          <p className="text-sm text-muted-foreground mt-1">
            {alert.vehicle.name} {alert.vehicle.plateNumber && `(${alert.vehicle.plateNumber})`}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground mt-2">
          {formatDate(alert.createdAt)}
        </p>
      </div>
    </div>
  )
}
