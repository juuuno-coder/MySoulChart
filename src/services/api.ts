// Vercel Serverless Functions 호출 클라이언트
// 기존 gemini.ts를 대체 (API 키가 서버에서만 관리됨)

import { AnalysisMode, UserProfile, Message } from '../types';
import { auth } from './firebase';

interface ChatResponse {
  text: string;
  depth: number | null;
}

interface FaceAnalysisResponse {
  features: string;
}

interface HistoryMessage {
  role: 'user' | 'model';
  text: string;
}

const API_BASE = '/api';
const TIMEOUT_MS = 45000;

/**
 * 타임아웃이 포함된 fetch 래퍼
 */
async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 도사 페르소나 에러 메시지 반환
 */
function getErrorMessage(status: number, fallback?: string): string {
  if (status === 429) {
    return '지금 너무 많은 영혼이 찾아와서 기가 고갈되었구나... 잠시 쉬었다가 다시 와주게. (일일 사용량 초과)';
  }
  if (status === 400) {
    return fallback || '입력한 내용을 다시 확인해주게.';
  }
  if (status >= 500) {
    return '기가 약해서 목소리가 잘 안 들리네... 잠시 후 다시 시도해주게.';
  }
  return fallback || '알 수 없는 기운이 방해하고 있구나...';
}

/**
 * 메시지 전송 (채팅)
 */
export const sendMessage = async (
  message: string,
  mode: AnalysisMode,
  profile: UserProfile,
  history: Message[] = []
): Promise<ChatResponse> => {
  try {
    // 히스토리를 API에 맞는 형태로 변환
    const historyMessages: HistoryMessage[] = history
      .filter(msg => !msg.isThinking)
      .map(msg => ({
        role: msg.role,
        text: msg.text,
      }));

    // 로그인한 사용자의 UID 가져오기 (Freemium 사용량 체크용)
    const uid = auth.currentUser?.uid;

    const response = await fetchWithTimeout(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        mode,
        profile: sanitizeProfile(profile),
        history: historyMessages,
        uid, // Phase 2H-3: Freemium 사용량 제한용
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        text: data.text || getErrorMessage(response.status, data.error),
        depth: data.depth ?? null,
      };
    }

    return { text: data.text, depth: data.depth ?? null };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        text: '대답이 너무 늦어 미안하네... 다시 물어봐주게. (응답 시간 초과)',
        depth: null,
      };
    }
    console.error('API call failed:', error);
    return {
      text: '기가 약해서 목소리가 잘 안 들리네... 잠시 후 다시 시도해주게.',
      depth: null,
    };
  }
};

/**
 * 관상 분석
 */
export const analyzeFace = async (imageBase64: string): Promise<string> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/analyze-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });

    const data: FaceAnalysisResponse = await response.json();

    if (!response.ok) {
      return data.features || '관상을 보는데 실패했구나... 잠시 후 다시 시도해주게.';
    }

    return data.features;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return '관상을 보는 데 시간이 좀 걸리네... 다시 시도해주게.';
    }
    console.error('Face analysis failed:', error);
    return '관상을 보는데 실패했구나... (이미지 분석 오류)';
  }
};

/**
 * 세션 시작 시 인사말 요청 (모드 전환 시 사용)
 */
export const initializeSession = async (
  mode: AnalysisMode,
  profile: UserProfile
): Promise<ChatResponse> => {
  const greetingMessage = `
  (System Instruction)
  [상황: 사용자가 상담 모드를 '${mode.toUpperCase()}'로 변경했습니다.]

  당신의 임무:
  1. 현재 설정된 시스템 프롬프트와 사용자의 데이터를 즉시 반영하십시오.
  2. 도사 페르소나를 유지하면서, 이 모드의 관점에서 사용자에게 건네는 첫 마디를 출력하십시오.
  3. 바로 본론을 찌르거나 관상의 특징을 언급하며 흥미를 유발하십시오.
  4. 길게 말하지 말고 1~2문장으로 임팩트 있게 끝내십시오.
  `;

  return sendMessage(greetingMessage, mode, profile, []);
};

/**
 * 프로필에서 민감 데이터(faceImage) 제거
 */
function sanitizeProfile(profile: UserProfile): UserProfile {
  const { faceImage, ...clean } = profile;
  return clean;
}
