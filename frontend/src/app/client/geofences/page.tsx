'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  MapPin, 
  Trash2,
  Edit3,
  Circle,
  Square,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function GeofencesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: geofences, isLoading } = useQuery({
    queryKey: ['my-geofences'],
    queryFn: () => api.get('/geofences').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/geofences/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-geofences'] }),
  });

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
            Geofences
          </h1>
          <p className="text-muted-foreground">Create zones and get alerts</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Geofence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Geofence</DialogTitle>
            </DialogHeader>
            <CreateGeofenceForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {geofences?.map((geofence: any, index: number) => (
          <motion.div
            key={geofence.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GeofenceCard 
              geofence={geofence} 
              onDelete={() => deleteMutation.mutate(geofence.id)}
            />
          </motion.div>
        ))}
      </div>

      {geofences?.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No geofences yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first geofence to get alerts
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Geofence
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function GeofenceCard({ geofence, onDelete }: any) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all group">
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
              <p className="text-xs text-muted-foreground capitalize">{geofence.type.toLowerCase()}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Vehicles assigned</span>
          <Badge variant="secondary">{geofence.vehicles?.length || 0}</Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Enter alerts</span>
            </div>
            <Switch checked={geofence.alertOnEnter} disabled />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Exit alerts</span>
            </div>
            <Switch checked={geofence.alertOnExit} disabled />
          </div>
        </div>

        <Button variant="outline" className="w-full gap-2">
          <Edit3 className="h-4 w-4" />
          Edit Geofence
        </Button>
      </CardContent>
    </Card>
  );
}

function CreateGeofenceForm({ onSuccess }: any) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<'CIRCLE' | 'POLYGON'>('CIRCLE');
  const [radius, setRadius] = useState(500);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/geofences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-geofences'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      type,
      coordinates: type === 'CIRCLE' 
        ? { center: { lat: 19.0760, lng: 72.8777 }, radius }
        : [{ lat: 19.0760, lng: 72.8777 }, { lat: 19.0860, lng: 72.8877 }],
      alertOnEnter: true,
      alertOnExit: true,
      color: '#3b82f6',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          placeholder="e.g., Office Zone"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Type</label>
        <div className="flex gap-2 mt-1">
          <Button
            type="button"
            variant={type === 'CIRCLE' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setType('CIRCLE')}
          >
            <Circle className="h-4 w-4 mr-2" />
            Circle
          </Button>
          <Button
            type="button"
            variant={type === 'POLYGON' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setType('POLYGON')}
          >
            <Square className="h-4 w-4 mr-2" />
            Polygon
          </Button>
        </div>
      </div>

      {type === 'CIRCLE' && (
        <div>
          <label className="text-sm font-medium">Radius (meters)</label>
          <Input
            type="number"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            min={50}
            max={10000}
          />
        </div>
      )}

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Note: You'll be able to adjust the exact position on the map after creation.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create Geofence'}
      </Button>
    </form>
  );
}
