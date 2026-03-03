import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'text-primary' }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 rounded-bl-3xl bg-${color.split('-')[1]}-500/10`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            trend.positive ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {trend.positive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trend.value}%</span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
