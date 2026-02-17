import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 바운더리 - 앱 전체가 깨지는 것을 방지
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 프로덕션에서는 에러 로깅 서비스에 전송
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // GA4 에러 추적 (gtag가 로드된 경우)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cosmic-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel rounded-2xl border border-nebula-500/30 p-8 space-y-6 text-center">
            {/* 아이콘 */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-bold text-nebula-200">
                영혼의 흐름이 막혔구나...
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                예상치 못한 기운의 흐름이 발생했습니다.<br />
                잠시 후 다시 시도해주세요.
              </p>
            </div>

            {/* 에러 메시지 (개발 환경에서만) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="glass-panel bg-red-900/10 border border-red-500/20 rounded-lg p-4 text-left">
                <p className="text-xs text-red-300 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-nebula-500/20 hover:bg-nebula-500/30 text-nebula-200 border border-nebula-500/30 font-medium transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                다시 시도
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-cosmic-700 text-gray-400 hover:text-gray-200 hover:border-cosmic-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                처음으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
