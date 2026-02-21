import { AnalysisMode, ZodiacSign } from './index';
import { SoulChartData } from './chart';

/**
 * 결과 카드에 표시될 데이터
 */
export interface CardData {
  // 사용자 정보
  userName: string;
  mode: AnalysisMode;
  zodiacSign?: ZodiacSign;

  // 핵심 메시지
  headline: string;         // "불꽃의 그릇을 가진 사람"
  traits: string[];          // 성격 특성 (최대 5개)
  advice: string;            // 핵심 조언 (1-2문장)

  // 행운 아이템
  luckyItems: {
    color: string;           // 행운의 색
    number: number;          // 행운의 숫자
    direction: string;       // 행운의 방향
  };

  // 메타데이터
  depthScore: number;        // 심도 점수 (0-100)
  createdAt: Date;
}

/**
 * AI로부터 카드 데이터를 생성하기 위한 요청 타입
 */
export interface GenerateCardRequest {
  mode: AnalysisMode;
  profile: {
    name: string;
    birthDate?: string;
    zodiacSign?: ZodiacSign;
    mbti?: string;
    bloodType?: string;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    text: string;
  }>;
  depthScore: number;
}

/**
 * 카드 생성 API 응답 타입
 */
export interface GenerateCardResponse {
  cardData: CardData;
}

/**
 * 종합 영혼 차트용 카드 데이터 (공유/저장용)
 */
export interface SoulChartCardData {
  userName: string;
  soulType: string;
  soulDescription: string;
  dimensions: SoulChartData['dimensions'];
  coreTraits: string[];
  lifeAdvice: string;
  luckyElements: SoulChartData['luckyElements'];
  completedModes: AnalysisMode[];
  createdAt: Date;
}
