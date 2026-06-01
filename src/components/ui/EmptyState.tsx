import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-primary ${className}`} />;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-text-muted mb-4 opacity-50">{icon}</div>}
      <p className="text-text-secondary font-medium mb-1">{title}</p>
      {description && <p className="text-text-muted text-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
