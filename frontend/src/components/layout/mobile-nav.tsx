'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
  LayoutDashboard, 
  Map, 
  Car, 
  Bell, 
  Settings,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const clientLinks = [
  { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/map', label: 'Live Map', icon: Map },
  { href: '/client/vehicles', label: 'Vehicles', icon: Car },
  { href: '/client/alerts', label: 'Alerts', icon: Bell },
  { href: '/client/settings', label: 'Settings', icon: Settings },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute left-0 top-0 h-full w-64 bg-card border-r p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-2">
          {clientLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 rounded-lg bg-muted mb-3">
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
