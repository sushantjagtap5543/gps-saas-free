'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Car, 
  Plus, 
  Search,
  Navigation,
  History,
  Settings,
  MapPin,
  Battery,
  Gauge
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function VehiclesPage() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  });

  const [searchQuery, setSearchQuery] = useState('');

  const filteredVehicles = vehicles?.filter((v: any) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            My Vehicles
          </h1>
          <p className="text-muted-foreground">Manage and monitor your fleet</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredVehicles?.map((vehicle: any, index: number) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <VehicleDetailCard vehicle={vehicle} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function VehicleDetailCard({ vehicle }: { vehicle: any }) {
  const statusConfig = {
    moving: { color: 'emerald', bg: 'bg-emerald-500', text: 'Moving', icon: Navigation },
    idle: { color: 'amber', bg: 'bg-amber-500', text: 'Idle', icon: Car },
    offline: { color: 'rose', bg: 'bg-rose-500', text: 'Offline', icon: MapPin },
  };

  const status = vehicle.speed > 0 ? 'moving' : vehicle.isActive ? 'idle' : 'offline';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div className={`h-2 ${config.bg}`} />
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-14 w-14 rounded-2xl ${config.bg}/10 flex items-center justify-center`}>
              <Car className={`h-7 w-7 text-${config.color}-500`} />
            </div>
            <div>
              <CardTitle className="text-xl">{vehicle.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{vehicle.plateNumber || 'No plate'}</p>
            </div>
          </div>
          <Badge className={`${config.bg}/10 text-${config.color}-500 border-0 gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatItem 
            icon={Gauge} 
            label="Current Speed" 
            value={`${vehicle.speed || 0} km/h`} 
          />
          <StatItem 
            icon={Navigation} 
            label="Heading" 
            value={`${vehicle.heading || 0}°`} 
          />
          <StatItem 
            icon={Battery} 
            label="Battery" 
            value={`${vehicle.batteryLevel || '--'}%`} 
          />
          <StatItem 
            icon={MapPin} 
            label="Geofences" 
            value={`${vehicle.geofences?.length || 0} zones`} 
          />
        </div>

        {/* Location Info */}
        {vehicle.latitude && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Last Location</p>
            <p className="text-sm font-mono">
              {vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Updated: {new Date(vehicle.lastPositionAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link href={`/client/map?vehicle=${vehicle.id}`} className="flex-1">
            <Button variant="default" className="w-full gap-2">
              <Navigation className="h-4 w-4" />
              Track Live
            </Button>
          </Link>
          <Link href={`/client/vehicles/${vehicle.id}/history`} className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
          </Link>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
