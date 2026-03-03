'use client';

import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Shield,
  Bell,
  Smartphone,
  Key
} from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0]}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user?.name}</h3>
              <Badge variant="secondary" className="capitalize">{user?.role}</Badge>
            </div>
          </div>

          <div className="grid gap-4 pt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </label>
              <Input value={user?.email} disabled />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone
              </label>
              <Input placeholder="+1234567890" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationSetting
            icon={Mail}
            title="Email Notifications"
            description="Receive alerts via email"
            defaultChecked={true}
          />
          <NotificationSetting
            icon={Smartphone}
            title="Push Notifications"
            description="Receive push notifications on your device"
            defaultChecked={true}
          />
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
              </div>
            </div>
            <Button variant="outline">Change</Button>
          </div>
        </CardContent>
      </Card>

      {/* Limits Info */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle>Account Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Maximum Vehicles</span>
              <Badge variant="secondary">{user?.maxVehicles} vehicles</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Maximum Geofences</span>
              <Badge variant="secondary">{user?.maxGeofences || 10} zones</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function NotificationSetting({ icon: Icon, title, description, defaultChecked }: any) {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
      />
    </div>
  );
}
