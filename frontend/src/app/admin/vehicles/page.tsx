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
  Search,
  MapPin,
  User,
  Activity
} from 'lucide-react';
import { useState } from 'react';

export default function AdminVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: () => api.get('/admin/vehicles').then(r => r.data),
  });

  const filteredVehicles = vehicles?.filter((v: any) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.imei.includes(searchQuery)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          All Vehicles
        </h1>
        <p className="text-muted-foreground">Manage all vehicles across the platform</p>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, plate, or IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="divide-y">
              {filteredVehicles?.map((vehicle: any) => (
                <div
                  key={vehicle.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        vehicle.speed > 0 ? 'bg-emerald-500/10' : vehicle.isActive ? 'bg-amber-500/10' : 'bg-rose-500/10'
                      }`}>
                        <Car className={`h-6 w-6 ${
                          vehicle.speed > 0 ? 'text-emerald-500' : vehicle.isActive ? 'text-amber-500' : 'text-rose-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{vehicle.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {vehicle.user?.name}
                          </span>
                          <span>{vehicle.plateNumber || 'No plate'}</span>
                          <span className="font-mono text-xs">{vehicle.imei}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <Badge variant={vehicle.isActive ? 'default' : 'secondary'}>
                          <Activity className="h-3 w-3 mr-1" />
                          {vehicle.isActive ? 'Online' : 'Offline'}
                        </Badge>
                        <p className="text-sm mt-1">
                          {vehicle.speed > 0 ? `${vehicle.speed} km/h` : 'Stopped'}
                        </p>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <p className="text-sm text-muted-foreground">Last seen</p>
                        <p className="text-sm">
                          {vehicle.lastPositionAt
                            ? new Date(vehicle.lastPositionAt).toLocaleString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        Track
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
