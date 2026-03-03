'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  MapPin, 
  AlertTriangle, 
  Route,
  Activity,
  Navigation,
  Clock,
  Fuel,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { VehicleMap } from '@/components/map/vehicle-map';
import { AlertList } from '@/components/alerts/alert-list';

export default function ClientDashboard() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  });

  const { data: alerts } = useQuery({
    queryKey: ['my-alerts'],
    queryFn: () => api.get('/alerts?limit=5').then(r => r.data),
  });

  const stats = {
    total: vehicles?.length || 0,
    online: vehicles?.filter((v: any) => v.isActive).length || 0,
    moving: vehicles?.filter((v: any) => v.speed > 0).length || 0,
    stopped: vehicles?.filter((v: any) => v.speed === 0).length || 0,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          My Fleet
        </h1>
        <p className="text-muted-foreground">Real-time overview of your vehicles</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehicles"
          value={stats.total}
          icon={Car}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          title="Online Now"
          value={stats.online}
          icon={Activity}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
          trend="+2 from yesterday"
        />
        <StatCard
          title="Moving"
          value={stats.moving}
          icon={Route}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          title="Stopped"
          value={stats.stopped}
          icon={MapPin}
          color="text-rose-500"
          bgColor="bg-rose-500/10"
        />
      </motion.div>

      {/* Live Map & Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card to-card/50">
            <CardHeader className="border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  Live Map
                </CardTitle>
                <Badge variant="outline" className="animate-pulse">
                  <span className="mr-1 h-2 w-2 rounded-full bg-green-500" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px]">
                <VehicleMap vehicles={vehicles || []} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-xl h-full">
            <CardHeader className="border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Recent Alerts
                </CardTitle>
                <Link href="/client/alerts">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <AlertList alerts={alerts || []} compact />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Vehicle Cards */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Vehicle Status</h2>
          <Link href="/client/vehicles">
            <Button variant="outline">View All Vehicles</Button>
          </Link>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles?.map((vehicle: any, index: number) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <VehicleCard vehicle={vehicle} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor, trend }: any) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
      <div className={`absolute top-0 right-0 p-3 rounded-bl-3xl ${bgColor}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function VehicleCard({ vehicle }: { vehicle: any }) {
  const statusColor = vehicle.speed > 0 ? 'emerald' : vehicle.isActive ? 'amber' : 'rose';
  const statusText = vehicle.speed > 0 ? 'Moving' : vehicle.isActive ? 'Idle' : 'Offline';
  
  return (
    <Link href={`/client/vehicles/${vehicle.id}`}>
      <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl bg-${statusColor}-500/10 flex items-center justify-center`}>
                <Car className={`h-6 w-6 text-${statusColor}-500`} />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {vehicle.name}
                </h3>
                <p className="text-sm text-muted-foreground">{vehicle.plateNumber}</p>
              </div>
            </div>
            <Badge variant={vehicle.speed > 0 ? 'default' : 'secondary'} className={`bg-${statusColor}-500/10 text-${statusColor}-500 border-0`}>
              {statusText}
            </Badge>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Navigation className="h-4 w-4" />
              <span>{vehicle.speed || 0} km/h</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Fuel className="h-4 w-4" />
              <span>{vehicle.fuelLevel || '--'}%</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {vehicle.lastPositionAt 
                  ? new Date(vehicle.lastPositionAt).toLocaleTimeString()
                  : 'Never'
                }
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{vehicle.geofences?.length || 0} zones</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
