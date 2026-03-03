'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  Route,
  Gauge,
  MapPin,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { format, subDays } from 'date-fns';

export default function VehicleHistoryPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  
  const [days, setDays] = useState(7);

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => api.get(`/vehicles/${vehicleId}`).then(r => r.data),
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ['vehicle-history', vehicleId, days],
    queryFn: () => api.get(`/vehicles/${vehicleId}/history?hours=${days * 24}`).then(r => r.data),
  });

  const stats = {
    totalDistance: history?.reduce((acc: number, pos: any) => acc + (pos.speed || 0) * 0.001, 0) || 0,
    avgSpeed: history?.length ? history.reduce((acc: number, pos: any) => acc + (pos.speed || 0), 0) / history.length : 0,
    maxSpeed: history?.length ? Math.max(...history.map((p: any) => p.speed || 0)) : 0,
    stopCount: history?.filter((p: any, i: number) => 
      i > 0 && p.speed === 0 && history[i-1].speed > 0
    ).length || 0,
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/client/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{vehicle?.name}</h1>
          <p className="text-muted-foreground">Trip History & Analytics</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2">
        {[1, 7, 14, 30].map((d) => (
          <Button
            key={d}
            variant={days === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(d)}
          >
            {d === 1 ? '24 Hours' : `${d} Days`}
          </Button>
        ))}
        <Button variant="outline" size="sm" className="ml-auto gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Distance"
          value={`${stats.totalDistance.toFixed(1)} km`}
          icon={Route}
        />
        <StatCard
          title="Average Speed"
          value={`${stats.avgSpeed.toFixed(0)} km/h`}
          icon={Gauge}
        />
        <StatCard
          title="Max Speed"
          value={`${stats.maxSpeed} km/h`}
          icon={Gauge}
          highlight
        />
        <StatCard
          title="Stops Made"
          value={stats.stopCount.toString()}
          icon={MapPin}
        />
      </div>

      {/* Timeline */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Position Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {history?.map((position: any, index: number) => (
                <TimelineItem
                  key={position.id}
                  position={position}
                  isFirst={index === 0}
                  isLast={index === history.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, highlight }: any) {
  return (
    <Card className={`border-0 shadow-lg ${highlight ? 'bg-primary text-primary-foreground' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${highlight ? 'opacity-80' : 'text-muted-foreground'}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ position, isFirst, isLast }: any) {
  const isMoving = position.speed > 0;
  
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full ${isMoving ? 'bg-emerald-500' : 'bg-amber-500'} ring-4 ring-background`} />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
      </div>
      
      <div className="flex-1 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant={isMoving ? 'default' : 'secondary'} className="mb-2">
              {isMoving ? `Moving at ${position.speed} km/h` : 'Stopped'}
            </Badge>
            <p className="text-sm font-mono text-muted-foreground">
              {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {format(new Date(position.recordedAt), 'HH:mm')}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(position.recordedAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        
        {position.ignition !== undefined && (
          <p className="text-xs text-muted-foreground mt-2">
            Ignition: {position.ignition ? 'ON' : 'OFF'}
            {position.batteryLevel && ` • Battery: ${position.batteryLevel}%`}
          </p>
        )}
      </div>
    </div>
  );
}
