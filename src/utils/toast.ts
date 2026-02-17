// 전역 토스트 알림 관리 시스템

type ToastType = 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

// 토스트 리스너들을 저장하는 Set
const listeners = new Set<(toasts: ToastMessage[]) => void>();

// 현재 활성화된 토스트들
let toasts: ToastMessage[] = [];

// 리스너 등록
export const subscribeToToasts = (listener: (toasts: ToastMessage[]) => void): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

// 모든 리스너에게 알림
const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts]));
};

// 토스트 표시 (메인 함수)
export const showToast = (
  type: ToastType,
  message: string,
  duration: number = 3000,
  action?: ToastAction
) => {
  const id = `toast-${Date.now()}-${Math.random()}`;

  const newToast: ToastMessage = { id, type, message, action };
  toasts = [...toasts, newToast];
  notifyListeners();

  // 자동으로 제거 (duration ms 후)
  setTimeout(() => {
    removeToast(id);
  }, duration);
};

// 토스트 제거
export const removeToast = (id: string) => {
  toasts = toasts.filter(toast => toast.id !== id);
  notifyListeners();
};

// 현재 토스트 목록 가져오기
export const getToasts = () => [...toasts];
