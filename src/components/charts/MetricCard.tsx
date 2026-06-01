import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'accent';
  subtitle?: string;
}

const colorMap = {
  primary: { bg: 'bg-primary/15', border: 'border-primary/20', icon: 'text-primary' },
  success: { bg: 'bg-success/15', border: 'border-success/20', icon: 'text-success' },
  warning: { bg: 'bg-warning/15', border: 'border-warning/20', icon: 'text-warning' },
  error: { bg: 'bg-error/15', border: 'border-error/20', icon: 'text-error' },
  secondary: { bg: 'bg-secondary/15', border: 'border-secondary/20', icon: 'text-secondary' },
  accent: { bg: 'bg-accent/15', border: 'border-accent/20', icon: 'text-accent' },
};

export function MetricCard({ title, value, unit, icon, trend, trendLabel, color = 'primary', subtitle }: MetricCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-success' : trend < 0 ? 'text-error' : 'text-text-muted'}`}>
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-text-primary">{value}</span>
          {unit && <span className="text-sm text-text-muted">{unit}</span>}
        </div>
        <p className="text-sm text-text-muted mt-1">{title}</p>
        {subtitle && <p className="text-xs text-text-muted mt-0.5 opacity-70">{subtitle}</p>}
        {trendLabel && <p className="text-xs text-text-muted mt-0.5">{trendLabel}</p>}
      </div>
    </div>
  );
}
