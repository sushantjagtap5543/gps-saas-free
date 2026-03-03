'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  delay?: number
}

const colorVariants = {
  blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
  green: 'from-green-500 to-green-600 shadow-green-500/25',
  yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/25',
  red: 'from-red-500 to-red-600 shadow-red-500/25',
  purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue',
  delay = 0 
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full -translate-y-1/2 translate-x-1/2",
          colorVariants[color]
        )} />
        
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span className={cn(
                  "text-xs font-medium",
                  trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
                )}>
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                </span>
              </div>
            )}
          </div>
          
          <div className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
            colorVariants[color]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
