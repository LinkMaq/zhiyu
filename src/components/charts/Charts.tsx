import { AreaChart, Area, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import type { TimeSeriesPoint } from '../../types';

interface MiniAreaChartProps {
  data: TimeSeriesPoint[];
  color?: string;
  height?: number;
}

export function MiniAreaChart({ data, color = '#3B82F6', height = 50 }: MiniAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ background: '#111E33', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11, color: '#A8BFDE' }}
          labelStyle={{ display: 'none' }}
          formatter={(v: unknown) => [(v as number).toFixed(1) + '%', '']}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#grad${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface GaugeChartProps {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  label?: string;
}

export function GaugeChart({ value, max = 100, size = 80, color = '#3B82F6', label }: GaugeChartProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        innerRadius={size * 0.35}
        outerRadius={size * 0.48}
        startAngle={90}
        endAngle={-270}
        data={[{ value: pct }]}
        barSize={size * 0.1}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={4} fill={color} background={{ fill: '#1E2D47' }} />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-text-primary">{pct}%</span>
        {label && <span className="text-xs text-text-muted">{label}</span>}
      </div>
    </div>
  );
}

interface ResourceBarProps {
  used: number;
  total: number;
  unit?: string;
  label?: string;
  colorClass?: string;
}

export function ResourceBar({ used, total, unit = '', label, colorClass = 'bg-primary' }: ResourceBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const warningColor = pct >= 90 ? 'bg-error' : pct >= 70 ? 'bg-warning' : colorClass;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">{label}</span>
          <span className="text-text-secondary font-medium">{used}{unit} / {total}{unit}</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${warningColor}`} style={{ width: `${pct}%` }} />
      </div>
      {!label && <span className="text-xs text-text-muted">{pct}%</span>}
    </div>
  );
}
