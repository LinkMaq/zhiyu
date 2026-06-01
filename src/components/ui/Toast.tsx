import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast as ToastType } from '../../hooks/useToast';

const iconMap = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <XCircle size={16} className="text-error" />,
  warning: <AlertTriangle size={16} className="text-warning" />,
  info: <Info size={16} className="text-accent" />,
};

const borderMap = {
  success: 'border-success/30',
  error: 'border-error/30',
  warning: 'border-warning/30',
  info: 'border-accent/30',
};

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  return (
    <div
      className={`flex items-start gap-3 bg-elevated border ${borderMap[toast.type]} rounded-xl px-4 py-3 shadow-2xl min-w-72 max-w-sm transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
    >
      {iconMap[toast.type]}
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="text-text-muted hover:text-text-secondary transition-colors shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  dismiss: (id: string) => void;
}

export function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
    </div>,
    document.body
  );
}
