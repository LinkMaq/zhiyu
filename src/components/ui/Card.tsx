import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  noPadding?: boolean;
}

export function Card({ glow, noPadding, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl ${noPadding ? '' : 'p-5'} ${glow ? 'card-glow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
