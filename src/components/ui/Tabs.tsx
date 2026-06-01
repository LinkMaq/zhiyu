import React from 'react';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 border-b border-border ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === tab.key
              ? 'text-primary border-primary'
              : 'text-text-muted border-transparent hover:text-text-secondary hover:border-border'
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${active === tab.key ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-muted'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
