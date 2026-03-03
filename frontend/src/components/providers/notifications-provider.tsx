'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';

interface NotificationsContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const NotificationsContext = createContext<NotificationsContextType>({
  socket: null,
  isConnected: false,
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      path: '/notifications',
      auth: { token },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to notifications');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new_alert', (alert) => {
      toast({
        title: 'New Alert',
        description: alert.message,
        variant: alert.severity === 'high' ? 'destructive' : 'default',
      });
    });

    newSocket.on('position_update', (data) => {
      // Handle real-time position updates
      console.log('Position update:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user]);

  return (
    <NotificationsContext.Provider value={{ socket, isConnected }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
