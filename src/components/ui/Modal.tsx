import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const widthMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-7xl' };

export function Modal({ open, onClose, title, children, width = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className={`relative w-full ${widthMap[width]} bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl shadow-2xl animate-fade-in`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-base)] text-text-muted hover:text-text-primary transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6 bg-[var(--color-bg-elevated)] rounded-b-2xl overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>,
    document.body
  );
}
