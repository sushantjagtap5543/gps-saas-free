'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Navigation, 
  Search, 
  Layers,
  LocateFixed,
  Car
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Dynamic import to avoid SSR issues with Leaflet
const LiveMap = dynamic(() => import('@/components/map/live-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-muted/50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

export default function MapPage() {
  const searchParams = useSearchParams();
  const selectedVehicleId = searchParams.get('vehicle');
  
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets');

  useEffect(() => {
    if (selectedVehicleId && vehicles) {
      const vehicle = vehicles.find((v: any) => v.id === selectedVehicleId);
      if (vehicle) setSelectedVehicle(vehicle);
    }
  }, [selectedVehicleId, vehicles]);

  const filteredVehicles = vehicles?.filter((v: any) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCount = vehicles?.filter((v: any) => v.isActive).length || 0;
  const movingCount = vehicles?.filter((v: any) => v.speed > 0).length || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-6rem)] space-y-4"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Live Tracking
          </h1>
          <p className="text-muted-foreground">Real-time vehicle locations</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {onlineCount} Online
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Navigation className="mr-1 h-3 w-3 text-amber-500" />
            {movingCount} Moving
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 h-full grid-cols-1 lg:grid-cols-4">
        {/* Vehicle List Sidebar */}
        <Card className="lg:col-span-1 border-0 shadow-xl flex flex-col h-[300px] lg:h-auto">
          <CardHeader className="border-b space-y-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicles
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-2">
            <div className="space-y-2">
              {filteredVehicles?.map((vehicle: any) => (
                <VehicleListItem
                  key={vehicle.id}
                  vehicle={vehicle}
                  isSelected={selectedVehicle?.id === vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map Area */}
        <Card className="lg:col-span-3 border-0 shadow-xl overflow-hidden relative">
          <CardContent className="p-0 h-full relative">
            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMapLayer(mapLayer === 'streets' ? 'satellite' : 'streets')}
                className="shadow-lg"
              >
                <Layers className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setSelectedVehicle(null)}
                className="shadow-lg"
                title="Fit all vehicles"
              >
                <LocateFixed className="h-4 w-4" />
              </Button>
            </div>

            {/* Map Component */}
            <LiveMap 
              vehicles={vehicles || []}
              selectedVehicle={selectedVehicle}
              onVehicleSelect={setSelectedVehicle}
              layer={mapLayer}
            />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function VehicleListItem({ vehicle, isSelected, onClick }: any) {
  const statusColor = vehicle.speed > 0 ? 'bg-emerald-500' : vehicle.isActive ? 'bg-amber-500' : 'bg-rose-500';
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all ${
        isSelected 
          ? 'bg-primary text-primary-foreground shadow-md' 
          : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${statusColor} ${vehicle.speed > 0 ? 'animate-pulse' : ''}`} />
          <div>
            <p className="font-medium text-sm">{vehicle.name}</p>
            <p className="text-xs opacity-70">{vehicle.plateNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium">{vehicle.speed || 0} km/h</p>
          <p className="text-xs opacity-70">
            {vehicle.lastPositionAt 
              ? new Date(vehicle.lastPositionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--:--'
            }
          </p>
        </div>
      </div>
    </button>
  );
}
