'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Shield,
  AlertTriangle,
  Save
} from 'lucide-react'
import { useState } from 'react'

const alertTypes = [
  { key: 'IGNITION_ON', label: 'Ignition ON', description: 'When vehicle engine starts' },
  { key: 'IGNITION_OFF', label: 'Ignition OFF', description: 'When vehicle engine stops' },
  { key: 'OVERSPEED', label: 'Overspeed', description: 'When speed exceeds limit' },
  { key: 'GEOFENCE_ENTER', label: 'Geofence Enter', description: 'When vehicle enters defined zone' },
  { key: 'GEOFENCE_EXIT', label: 'Geofence Exit', description: 'When vehicle leaves defined zone' },
  { key: 'DEVICE_OFFLINE', label: 'Device Offline', description: 'When device stops reporting' },
  { key: 'LOW_BATTERY', label: 'Low Battery', description: 'When device battery is low' },
]

export default function AlertConfigPage() {
  const queryClient = useQueryClient()
  const [configs, setConfigs] = useState<any>({})

  const { data: alertConfigs } = useQuery({
    queryKey: ['alert-configs'],
    queryFn: () => api.get('/alerts/config').then(r => r.data),
    onSuccess: (data) => {
      const configMap = data.reduce((acc: any, config: any) => {
        acc[config.alertType] = config
        return acc
      }, {})
      setConfigs(configMap)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ type, data }: { type: string, data: any }) => 
      api.put(`/alerts/config/${type}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-configs'] }),
  })

  const handleToggle = (type: string, field: string, value: boolean) => {
    setConfigs((prev: any) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }))
  }

  const saveConfig = (type: string) => {
    updateMutation.mutate({ type, data: configs[type] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alert Configuration</h1>
        <p className="text-muted-foreground">Control notification settings for all users</p>
      </div>

      <div className="grid gap-6">
        {alertTypes.map((alert, index) => {
          const config = configs[alert.key]
          if (!config) return null

          return (
            <motion.div
              key={alert.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{alert.label}</CardTitle>
                        <CardDescription>{alert.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.isEnabled ? 'success' : 'secondary'}>
                        {config.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Switch
                        checked={config.isEnabled}
                        onCheckedChange={(v) => handleToggle(alert.key, 'isEnabled', v)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                {config.isEnabled && (
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Notify Admin</span>
                        </div>
                        <Switch
                          checked={config.notifyAdmin}
                          onCheckedChange={(v) => handleToggle(alert.key, 'notifyAdmin', v)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Notify Client</span>
                        </div>
                        <Switch
                          checked={config.notifyClient}
                          onCheckedChange={(v) => handleToggle(alert.key, 'notifyClient', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Email Alerts</span>
                        </div>
                        <Switch
                          checked={config.channels?.includes('EMAIL')}
                          onCheckedChange={(v) => {
                            const channels = v 
                              ? [...(config.channels || []), 'EMAIL']
                              : (config.channels || []).filter((c: string) => c !== 'EMAIL')
                            handleToggle(alert.key, 'channels', channels)
                          }}
                        />
                      </div>
                    </div>

                    {alert.key === 'OVERSPEED' && (
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Speed Limit</p>
                          <p className="text-xs text-muted-foreground">Current: {config.speedLimit || 80} km/h</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => saveConfig(alert.key)}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
