'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Check, 
  AlertTriangle,
  Navigation,
  MapPin,
  Clock,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['my-alerts'],
    queryFn: () => api.get('/alerts').then(r => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/alerts/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-alerts'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/alerts/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-alerts'] }),
  });

  const unreadCount = alerts?.filter((a: any) => !a.isRead).length || 0;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Alerts
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alerts?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p>No alerts yet</p>
              <p className="text-sm">Alerts will appear here when triggered</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts?.map((alert: any) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMarkRead={() => markReadMutation.mutate(alert.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AlertItem({ alert, onMarkRead }: any) {
  const icons: any = {
    GEOFENCE_ENTER: MapPin,
    GEOFENCE_EXIT: Navigation,
    OVERSPEED: AlertTriangle,
    IGNITION_ON: Bell,
    IGNITION_OFF: Bell,
    DEVICE_OFFLINE: AlertTriangle,
  };

  const colors: any = {
    GEOFENCE_ENTER: 'text-emerald-500 bg-emerald-500/10',
    GEOFENCE_EXIT: 'text-amber-500 bg-amber-500/10',
    OVERSPEED: 'text-rose-500 bg-rose-500/10',
    IGNITION_ON: 'text-blue-500 bg-blue-500/10',
    IGNITION_OFF: 'text-slate-500 bg-slate-500/10',
    DEVICE_OFFLINE: 'text-rose-500 bg-rose-500/10',
  };

  const Icon = icons[alert.type] || Bell;
  const colorClass = colors[alert.type] || 'text-primary bg-primary/10';

  return (
    <div className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${!alert.isRead ? 'bg-primary/5' : ''}`}>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{alert.message}</p>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
              </span>
              {alert.vehicle && (
                <span>• {alert.vehicle.name}</span>
              )}
            </div>
          </div>
          
          {!alert.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkRead}
              className="shrink-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {alert.latitude && (
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
}
