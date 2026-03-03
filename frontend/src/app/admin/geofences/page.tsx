'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Circle,
  Square,
  Users,
  Car
} from 'lucide-react';

export default function AdminGeofencesPage() {
  const { data: geofences, isLoading } = useQuery({
    queryKey: ['admin-geofences'],
    queryFn: () => api.get('/geofences').then(r => r.data),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            All Geofences
          </h1>
          <p className="text-muted-foreground">Manage geofence zones across the platform</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {geofences?.map((geofence: any) => (
          <Card key={geofence.id} className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${geofence.color}20` }}
                  >
                    {geofence.type === 'CIRCLE' ? (
                      <Circle className="h-5 w-5" style={{ color: geofence.color }} />
                    ) : (
                      <Square className="h-5 w-5" style={{ color: geofence.color }} />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{geofence.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">
                      {geofence.type.toLowerCase()} zone
                    </p>
                  </div>
                </div>
                <Badge variant={geofence.isActive ? 'default' : 'secondary'}>
                  {geofence.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Owner
                </span>
                <span className="font-medium">{geofence.user?.name}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Assigned Vehicles
                </span>
                <Badge variant="secondary">{geofence.vehicles?.length || 0}</Badge>
              </div>

              <div className="flex gap-2 pt-2">
                <div className="flex-1 p-2 rounded bg-muted text-center">
                  <p className="text-xs text-muted-foreground">Enter Alerts</p>
                  <p className="text-sm font-medium">{geofence.alertOnEnter ? 'ON' : 'OFF'}</p>
                </div>
                <div className="flex-1 p-2 rounded bg-muted text-center">
                  <p className="text-xs text-muted-foreground">Exit Alerts</p>
                  <p className="text-sm font-medium">{geofence.alertOnExit ? 'ON' : 'OFF'}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                View on Map
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
