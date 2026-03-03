import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatSpeed(speed: number) {
  return `${Math.round(speed || 0)} km/h`
}

export function getStatusColor(speed: number, isActive: boolean) {
  if (!isActive) return 'text-gray-500'
  if (speed > 0) return 'text-green-500'
  return 'text-yellow-500'
}

export function getBatteryColor(level: number) {
  if (level > 50) return 'text-green-500'
  if (level > 20) return 'text-yellow-500'
  return 'text-red-500'
}
