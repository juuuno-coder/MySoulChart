/**
 * My Soul Chart - Mobile Toast (pub/sub 패턴)
 * 비차단 토스트 알림 시스템
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastMessage[]) => void;

const listeners = new Set<Listener>();
let toasts: ToastMessage[] = [];

const notifyListeners = () => {
  const snapshot = [...toasts];
  listeners.forEach(listener => listener(snapshot));
};

export function subscribeToToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function showToast(type: ToastType, message: string, duration = 3000): void {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  toasts = [...toasts, { id, type, message }];
  notifyListeners();
  setTimeout(() => removeToast(id), duration);
}

export function removeToast(id: string): void {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}
