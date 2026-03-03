'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { StatsCard } from '@/components/dashboard/stats-card'
import { 
  Users, 
  Car, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  MapPin
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: 'blue' as const,
      trend: 'up',
      trendValue: '+12%'
    },
    { 
      title: 'Total Vehicles', 
      value: stats?.totalVehicles || 0, 
      icon: Car, 
      color: 'green' as const,
      trend: 'up',
      trendValue: '+5%'
    },
    { 
      title: 'Active Now', 
      value: stats?.onlineNow || 0, 
      icon: Activity, 
      color: 'purple' as const,
      description: 'Currently tracking'
    },
    { 
      title: "Today's Alerts", 
      value: stats?.todayAlerts || 0, 
      icon: AlertTriangle, 
      color: 'yellow' as const,
      trend: 'down',
      trendValue: '-8%'
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Vehicle position updated</p>
                    <p className="text-sm text-muted-foreground">Tata Ace • 2 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">Database</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">GPS Server</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">WebSocket</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Uptime</span>
                </div>
                <span className="text-sm text-blue-600 font-medium">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
