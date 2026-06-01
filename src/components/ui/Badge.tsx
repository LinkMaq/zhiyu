type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'accent' | 'ghost';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-text-secondary',
  primary: 'bg-primary/15 text-blue-300 border border-primary/30',
  success: 'bg-success/15 text-emerald-300 border border-success/30',
  warning: 'bg-warning/15 text-amber-300 border border-warning/30',
  error: 'bg-error/15 text-red-300 border border-error/30',
  secondary: 'bg-secondary/15 text-purple-300 border border-secondary/30',
  accent: 'bg-accent/15 text-cyan-300 border border-accent/30',
  ghost: 'bg-transparent border border-border text-text-muted',
};

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

import React from 'react';

export function Badge({ variant = 'default', size = 'sm', children, className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-md font-medium ${sizeClass} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
