'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Mail,
  MessageSquare,
  AlertTriangle,
  Settings
} from 'lucide-react';

const alertTypes = [
  { key: 'IGNITION_ON', label: 'Ignition ON', description: 'When vehicle ignition is turned on' },
  { key: 'IGNITION_OFF', label: 'Ignition OFF', description: 'When vehicle ignition is turned off' },
  { key: 'OVERSPEED', label: 'Overspeed', description: 'When vehicle exceeds speed limit' },
  { key: 'GEOFENCE_ENTER', label: 'Geofence Enter', description: 'When vehicle enters a geofence zone' },
  { key: 'GEOFENCE_EXIT', label: 'Geofence Exit', description: 'When vehicle exits a geofence zone' },
  { key: 'DEVICE_OFFLINE', label: 'Device Offline', description: 'When device goes offline' },
  { key: 'LOW_BATTERY', label: 'Low Battery', description: 'When device battery is low' },
];

export default function AdminAlertsPage() {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['alert-configs'],
    queryFn: () => api.get('/alerts/config').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ type, data }: any) => api.put(`/alerts/config/${type}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-configs'] }),
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
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Alert Configuration
        </h1>
        <p className="text-muted-foreground">Control notification settings for all users</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Alert Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Bell className="h-4 w-4" />
            Alert History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="grid gap-4">
            {alertTypes.map((alertType) => {
              const config = configs?.find((c: any) => c.alertType === alertType.key) || {
                isEnabled: true,
                notifyAdmin: true,
                notifyClient: true,
                channels: ['WEBSOCKET'],
              };

              return (
                <Card key={alertType.key} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <h3 className="font-semibold text-lg">{alertType.label}</h3>
                          <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                            {config.isEnabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{alertType.description}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="space-y-3 min-w-[200px]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Enable Alert</span>
                            <Switch
                              checked={config.isEnabled}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({
                                  type: alertType.key,
                                  data: { ...config, isEnabled: checked },
                                })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Notify Admin</span>
                            <Switch
                              checked={config.notifyAdmin}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({
                                  type: alertType.key,
                                  data: { ...config, notifyAdmin: checked },
                                })
                              }
                              disabled={!config.isEnabled}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Notify Client</span>
                            <Switch
                              checked={config.notifyClient}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({
                                  type: alertType.key,
                                  data: { ...config, notifyClient: checked },
                                })
                              }
                              disabled={!config.isEnabled}
                            />
                          </div>
                        </div>

                        <div className="border-l pl-6 space-y-2">
                          <p className="text-sm font-medium mb-2">Channels</p>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">WebSocket</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Email</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Recent System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Alert history will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
