
type StatusType = 'running' | 'stopped' | 'error' | 'warning' | 'idle' | 'deploying' | 'starting' | 'queued' | 'completed' | 'stopping' | 'scaling';

const colorMap: Record<StatusType, string> = {
  running:   'bg-success shadow-[0_0_6px_rgba(16,185,129,0.6)]',
  completed: 'bg-success',
  stopped:   'bg-text-muted',
  error:     'bg-error shadow-[0_0_6px_rgba(239,68,68,0.6)]',
  warning:   'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.6)]',
  idle:      'bg-warning',
  deploying: 'bg-accent shadow-[0_0_6px_rgba(6,182,212,0.6)]',
  starting:  'bg-accent',
  queued:    'bg-secondary/70',
  stopping:  'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.5)]',
  scaling:   'bg-accent shadow-[0_0_6px_rgba(6,182,212,0.6)]',
};

const pulseStates: StatusType[] = ['running', 'error', 'deploying', 'starting', 'stopping', 'scaling'];

interface StatusDotProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

export function StatusDot({ status, size = 'sm' }: StatusDotProps) {
  const s = status as StatusType;
  const color = colorMap[s] ?? 'bg-text-muted';
  const pulse = pulseStates.includes(s);
  const dim = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return (
    <span className="relative inline-flex items-center justify-center">
      {pulse && <span className={`absolute inline-flex rounded-full ${color} opacity-50 animate-ping ${dim}`} />}
      <span className={`relative inline-flex rounded-full ${color} ${dim}`} />
    </span>
  );
}
