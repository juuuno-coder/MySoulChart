/**
 * GA4 이벤트 추적 React 훅
 */

import { useEffect, useRef } from 'react';
import {
  trackSessionStart,
  trackModeSwitch,
  trackMessageSent,
  trackCardGenerated,
  trackShare,
  trackOnboardingComplete,
  trackError,
  trackPageView,
} from '../utils/analytics';
import type { AnalysisMode } from '../types';

/**
 * 세션 시작 추적
 */
export function useSessionStartTracking(mode: AnalysisMode | null, hasProfile: boolean) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (mode && !hasTracked.current) {
      trackSessionStart(mode, hasProfile);
      hasTracked.current = true;
    }
  }, [mode, hasProfile]);
}

/**
 * 모드 전환 추적
 */
export function useModeSwitch(mode: AnalysisMode | null) {
  const prevMode = useRef<AnalysisMode | null>(null);

  useEffect(() => {
    if (mode && prevMode.current !== mode) {
      if (prevMode.current !== null) {
        trackModeSwitch(prevMode.current, mode);
      }
      prevMode.current = mode;
    }
  }, [mode]);
}

/**
 * 메시지 전송 추적
 */
export function useMessageTracking() {
  return (mode: AnalysisMode, messageLength: number, turnNumber: number) => {
    trackMessageSent(mode, messageLength, turnNumber);
  };
}

/**
 * 카드 생성 추적
 */
export function useCardTracking() {
  return (mode: AnalysisMode, depthScore: number) => {
    trackCardGenerated(mode, depthScore);
  };
}

/**
 * 공유 추적
 */
export function useShareTracking() {
  return (method: 'kakao' | 'twitter' | 'native' | 'copy', mode: AnalysisMode) => {
    trackShare(method, mode);
  };
}

/**
 * 온보딩 추적
 */
export function useOnboardingTracking() {
  return (step: number) => {
    trackOnboardingComplete(step);
  };
}

/**
 * 에러 추적
 */
export function useErrorTracking() {
  return (errorType: string, errorMessage: string, mode?: AnalysisMode) => {
    trackError(errorType, errorMessage, mode);
  };
}

/**
 * 페이지 뷰 추적 (SPA 라우팅용)
 */
export function usePageViewTracking(pagePath: string, pageTitle: string) {
  useEffect(() => {
    trackPageView(pagePath, pageTitle);
  }, [pagePath, pageTitle]);
}
