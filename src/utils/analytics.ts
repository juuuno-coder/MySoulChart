/**
 * Google Analytics 4 이벤트 추적 유틸리티
 */

// GA4 전역 타입 정의
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * GA4가 로드되었는지 확인
 */
function isGALoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * 세션 시작 이벤트
 */
export function trackSessionStart(mode: string, hasProfile: boolean) {
  if (!isGALoaded()) return;

  window.gtag?.('event', 'session_start', {
    event_category: 'engagement',
    mode: mode,
    has_profile: hasProfile,
    timestamp: new Date().toISOString(),
  });
}

/**
 * 모드 전환 이벤트
 */
export function trackModeSwitch(fromMode: string | null, toMode: string) {
  if (!isGALoaded()) return;

  window.gtag?.('event', 'mode_switch', {
    event_category: 'interaction',
    from_mode: fromMode || 'none',
    to_mode: toMode,
  });
}

/**
 * 메시지 전송 이벤트
 */
export function trackMessageSent(mode: string, messageLength: number, turnNumber: number) {
  if (!isGALoaded()) return;

  window.gtag?.('event', 'message_sent', {
    event_category: 'engagement',
    mode: mode,
    message_length: messageLength,
    turn_number: turnNumber,
  });
}

/**
 * 결과 카드 생성 이벤트
 */
export function trackCardGenerated(mode: string, depthScore: number) {
  if (!isGALoaded()) return;

  window.gtag?.('event', 'card_generated', {
    event_category: 'conversion',
    mode: mode,
    depth_score: depthScore,
    value: depthScore, // 커스텀 가치 측정
  });
}

/**
 * SNS 공유 이벤트
 */
export function trackShare(method: 'kakao' | 'twitter' | 'native' | 'copy', mode: string) {
  if (!isGALoaded()) return;

  window.gtag?.('event', 'share', {
    event_category: 'social',
    method: method,
    content_type: 'result_card',
    mode: mode,
  });
}

/**
 * 온보딩 완료 이벤트
 */
export function trackOnboardingComplete(step: number) {
  if (!isGALoaded()) return;

  window.gtag?.('event', 'onboarding_complete', {
    event_category: 'engagement',
    final_step: step,
  });
}

/**
 * 에러 발생 이벤트
 */
export function trackError(errorType: string, errorMessage: string, mode?: string) {
  if (!isGALoaded()) return;

  window.gtag?.('event', 'exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    mode: mode || 'unknown',
  });
}

/**
 * 페이지 뷰 이벤트 (SPA용)
 */
export function trackPageView(pagePath: string, pageTitle: string) {
  if (!isGALoaded()) return;

  window.gtag?.('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}
