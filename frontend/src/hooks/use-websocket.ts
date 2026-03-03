import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return

    const socket = io(`${WS_URL}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  const subscribeToVehicle = useCallback((vehicleId: string) => {
    socketRef.current?.emit('subscribe_vehicle', vehicleId)
  }, [])

  const onVehicleUpdate = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('position_update', callback)
    return () => {
      socketRef.current?.off('position_update', callback)
    }
  }, [])

  const onNewAlert = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('new_alert', callback)
    return () => {
      socketRef.current?.off('new_alert', callback)
    }
  }, [])

  return {
    socket: socketRef.current,
    subscribeToVehicle,
    onVehicleUpdate,
    onNewAlert,
  }
}
