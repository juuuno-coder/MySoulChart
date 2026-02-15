// LocalStorage 기반 세션 저장/복원 시스템

import { UserProfile, Message, AnalysisMode } from '../types';

const SESSION_KEY = 'vibeSession';

export interface SessionData {
  profile: UserProfile;
  messages: Message[];
  depthScore: number;
  mode: AnalysisMode;
  timestamp: number; // 저장 시점 (Date.now())
}

/**
 * 현재 세션을 localStorage에 저장
 * - faceImage(base64)는 용량 문제로 저장하지 않음
 * - faceFeatures(텍스트 분석 결과)만 저장
 */
export const saveSession = (data: Omit<SessionData, 'timestamp'>) => {
  try {
    // faceImage 제거 (용량 + 개인정보 보호)
    const cleanProfile: UserProfile = {
      ...data.profile,
      faceImage: undefined,
    };

    const sessionData: SessionData = {
      ...data,
      profile: cleanProfile,
      timestamp: Date.now(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.warn('세션 저장 실패:', error);
  }
};

/**
 * 저장된 세션 불러오기
 * - 24시간 이내 세션만 유효
 * - 만료된 세션은 자동 삭제
 */
export const loadSession = (): SessionData | null => {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;

    const session: SessionData = JSON.parse(saved);

    // 24시간 이내 세션만 유효
    const hoursPassed = (Date.now() - session.timestamp) / (1000 * 60 * 60);
    if (hoursPassed > 24) {
      clearSession();
      return null;
    }

    // Date 객체 복원 (JSON 직렬화 시 문자열로 변환됨)
    if (session.messages) {
      session.messages = session.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }

    return session;
  } catch (error) {
    console.warn('세션 불러오기 실패:', error);
    clearSession();
    return null;
  }
};

/**
 * 저장된 세션 삭제
 */
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('세션 삭제 실패:', error);
  }
};

/**
 * 저장된 세션의 마지막 활동 시간을 읽기 좋은 문자열로 변환
 */
export const getSessionTimeAgo = (timestamp: number): string => {
  const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  return '하루 이상 전';
};
