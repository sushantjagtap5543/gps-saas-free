'use client';

import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  MapPin, 
  Navigation, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertListProps {
  alerts: any[];
  compact?: boolean;
}

export function AlertList({ alerts, compact = false }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No alerts</p>
      </div>
    );
  }

  const icons: any = {
    GEOFENCE_ENTER: MapPin,
    GEOFENCE_EXIT: Navigation,
    OVERSPEED: AlertTriangle,
    IGNITION_ON: Bell,
    IGNITION_OFF: Bell,
    DEVICE_OFFLINE: AlertTriangle,
  };

  const colors: any = {
    GEOFENCE_ENTER: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    GEOFENCE_EXIT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    OVERSPEED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    IGNITION_ON: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    IGNITION_OFF: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    DEVICE_OFFLINE: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="space-y-3">
      {alerts.slice(0, compact ? 3 : undefined).map((alert) => {
        const Icon = icons[alert.type] || Bell;
        const colorClass = colors[alert.type] || colors.IGNITION_ON;

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${colorClass} ${
              !alert.isRead ? 'bg-opacity-50' : ''
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{alert.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 opacity-70" />
                <span className="text-xs opacity-70">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {!alert.isRead && (
              <div className="h-2 w-2 rounded-full bg-current shrink-0 mt-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
