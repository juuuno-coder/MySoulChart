import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { subscribeToToasts, removeToast, ToastMessage } from '../../utils/toast';

const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // 토스트 변경사항 구독
    const unsubscribe = subscribeToToasts(setToasts);
    return unsubscribe;
  }, []);

  // Portal을 사용하여 body 직속으로 렌더링
  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
};

const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const [isExiting, setIsExiting] = useState(false);

  // 토스트 제거 애니메이션
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // 애니메이션 시간과 맞춤
  };

  // 타입별 아이콘 및 색상
  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle size={20} />,
          bgClass: 'bg-aurora-900/60',
          borderClass: 'border-aurora-500/40',
          textClass: 'text-aurora-100',
          iconClass: 'text-aurora-400'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} />,
          bgClass: 'bg-gold-900/60',
          borderClass: 'border-gold-500/40',
          textClass: 'text-gold-100',
          iconClass: 'text-gold-400'
        };
      case 'error':
        return {
          icon: <XCircle size={20} />,
          bgClass: 'bg-red-900/60',
          borderClass: 'border-red-500/40',
          textClass: 'text-red-100',
          iconClass: 'text-red-400'
        };
    }
  };

  const style = getToastStyle();

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg
        backdrop-blur-xl shadow-lg border
        transform transition-all duration-300 ease-out
        ${style.bgClass} ${style.borderClass}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* 아이콘 */}
      <div className={`flex-shrink-0 ${style.iconClass}`}>
        {style.icon}
      </div>

      {/* 메시지 및 액션 */}
      <div className="flex-1 flex flex-col gap-2">
        <p className={`text-sm font-medium leading-relaxed ${style.textClass}`}>
          {toast.message}
        </p>

        {/* 액션 버튼 (있을 경우만) */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              handleClose();
            }}
            className={`
              self-start px-3 py-1.5 rounded-md text-xs font-medium
              ${style.iconClass} bg-cosmic-800/80 hover:bg-cosmic-700/80
              transition-colors duration-200
            `}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className={`flex-shrink-0 ${style.textClass} hover:opacity-80 transition-opacity`}
        aria-label="토스트 닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
