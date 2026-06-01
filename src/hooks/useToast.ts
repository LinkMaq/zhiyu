import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return {
    toasts,
    dismiss,
    toast: {
      success: (title: string, msg?: string) => show('success', msg ? `${title}：${msg}` : title),
      error: (title: string, msg?: string) => show('error', msg ? `${title}：${msg}` : title),
      warning: (title: string, msg?: string) => show('warning', msg ? `${title}：${msg}` : title),
      info: (title: string, msg?: string) => show('info', msg ? `${title}：${msg}` : title),
    },
  };
}
