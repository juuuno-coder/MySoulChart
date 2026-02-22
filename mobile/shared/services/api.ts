/**
 * My Soul Chart - Mobile API Service
 * 항상 Vercel 서버 API를 호출 (로컬 개발 코드 제거)
 */
import { AnalysisMode, Message, UserProfile } from '../types';
import { CardData } from '../types/card';
import { SoulChartData } from '../types/chart';

// 프로덕션 API URL
const API_BASE_URL = 'https://my-soul-chart.vercel.app/api';

/**
 * Depth 태그 파싱
 */
function parseDepth(text: string): { cleanText: string; depth: number } {
  const depthMatch = text.match(/<DEPTH>(\d+)<\/DEPTH>/);
  if (!depthMatch) {
    return { cleanText: text, depth: 50 };
  }
  const depth = parseInt(depthMatch[1], 10);
  const cleanText = text.replace(/<DEPTH>\d+<\/DEPTH>/g, '').trim();
  return { cleanText, depth };
}

/**
 * Gemini API를 통해 메시지 전송
 */
export async function sendMessage(
  message: string,
  mode: AnalysisMode,
  profile: UserProfile,
  history: Message[],
  soulChart?: SoulChartData
): Promise<{ text: string; depth: number }> {
  try {
    const body: any = {
      message,
      mode,
      profile,
      history: history.map(msg => ({
        role: msg.role,
        text: msg.text,
      })),
    };

    if (soulChart) {
      body.soulChart = soulChart;
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '서버 오류가 발생했습니다');
    }

    const data = await response.json();
    return { text: data.text, depth: data.depth };
  } catch (error: any) {
    console.error('API Error:', error);
    throw new Error(error.message || '통신 오류가 발생했습니다');
  }
}

/**
 * 관상 분석 (이미지 업로드)
 */
export async function analyzeFace(
  imageBase64: string
): Promise<{
  faceShape: string;
  forehead: string;
  eyes: string;
  nose: string;
  mouth: string;
  chin: string;
  samjeong?: { upper: string; middle: string; lower: string };
  eyebrows?: string;
  ears?: string;
  impression?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '관상 분석 오류가 발생했습니다');
    }

    const data = await response.json();
    return data.features;
  } catch (error: any) {
    console.error('Face Analysis Error:', error);
    throw new Error(error.message || '관상 분석 중 오류가 발생했습니다');
  }
}

/**
 * 세션 시작 (인사말 생성)
 */
export async function initializeSession(
  mode: AnalysisMode,
  profile: UserProfile
): Promise<{ text: string; depth: number }> {
  try {
    // 간단한 인사 트리거
    const greetingTrigger = '상담을 시작합니다. 내담자의 프로필을 확인하고 첫 인사와 함께 분석을 시작해주세요.';

    const response = await sendMessage(greetingTrigger, mode, profile, []);
    return response;
  } catch (error: any) {
    console.error('Session Initialization Error:', error);
    return {
      text: '어서 와요. 얼굴을 딱 보니... 뭔가 답답한 게 꽉 막혀있는 거 같은데?',
      depth: 10,
    };
  }
}

/**
 * 결과 카드 생성
 */
export async function generateCard(
  mode: AnalysisMode,
  profile: Partial<UserProfile>,
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
  depthScore: number
): Promise<CardData> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, profile, conversationHistory, depthScore }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '카드 생성 오류가 발생했습니다');
    }

    const data = await response.json();
    return data.cardData;
  } catch (error: any) {
    console.error('Card Generation Error:', error);
    throw new Error(error.message || '카드 생성 중 오류가 발생했습니다');
  }
}

/**
 * 영혼 차트 생성
 */
export async function generateSoulChart(
  profile: Partial<UserProfile>,
  analyses: Record<string, CardData>
): Promise<SoulChartData> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-soul-chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, analyses }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '종합 차트 생성 오류가 발생했습니다');
    }

    const data = await response.json();
    return data.soulChart;
  } catch (error: any) {
    console.error('Soul Chart Generation Error:', error);
    throw new Error(error.message || '종합 차트 생성 중 오류가 발생했습니다');
  }
}

/**
 * 통합 상담 대화에서 영혼 차트 생성 (unified 모드)
 */
export async function generateSoulChartFromConversation(
  profile: Partial<UserProfile>,
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>
): Promise<SoulChartData> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-soul-chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, conversationHistory, mode: 'unified' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '영혼 차트 생성 오류가 발생했습니다');
    }

    const data = await response.json();
    return data.soulChart;
  } catch (error: any) {
    console.error('Soul Chart From Conversation Error:', error);
    throw new Error(error.message || '영혼 차트 생성 중 오류가 발생했습니다');
  }
}
