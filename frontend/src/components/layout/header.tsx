'use client'

import { useAuth } from '@/hooks/use-auth'
import { Bell, Menu, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Header() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Fetch unread alerts
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/alerts/unread-count')
        const data = await res.json()
        setUnreadCount(data.count)
      } catch (error) {
        console.error('Failed to fetch unread count')
      }
    }
    
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold hidden sm:block">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </header>
  )
}
