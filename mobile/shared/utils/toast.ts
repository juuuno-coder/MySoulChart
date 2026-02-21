/**
 * My Soul Chart - Mobile Toast (Alert 기반)
 */
import { Alert } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(type: ToastType, message: string): void {
  const titles: Record<ToastType, string> = {
    success: '성공',
    error: '오류',
    info: '안내',
    warning: '주의',
  };

  Alert.alert(titles[type], message);
}
