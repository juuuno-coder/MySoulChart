// 종합 차트 빌딩 시스템 타입 (Phase 2I)
import { AnalysisMode } from './index';

/**
 * 분석 결과 카드 데이터
 */
export interface CardData {
  userName: string;
  mode: AnalysisMode;
  headline: string;         // "불꽃의 그릇을 가진 사람"
  traits: string[];         // 성격 특성 (3-5개)
  advice: string;           // 핵심 조언
  luckyItems?: {
    color?: string;         // 행운의 색상
    number?: number;        // 행운의 숫자
    direction?: string;     // 행운의 방향
  };
  depthScore: number;       // 상담 심도 (0-100)
  completedAt?: Date;       // 완료 시각
}

/**
 * 분석 완료 결과
 */
export interface AnalysisResult {
  mode: AnalysisMode;
  completedAt: Date;
  cardData: CardData;       // 결과 카드 데이터
  summary: string;          // AI 요약 (한 줄)
  depthScore: number;       // 심도 점수
}

/**
 * 사용자 종합 차트
 */
export interface UserChart {
  uid: string;
  name: string;
  profileImage?: string;

  // 완료된 분석들
  completedAnalyses: {
    face?: AnalysisResult;
    zodiac?: AnalysisResult;
    mbti?: AnalysisResult;
    saju?: AnalysisResult;
    blood?: AnalysisResult;
  };

  // 진행률
  progressPercentage: number;   // 0~100
  totalAnalyses: number;         // 5
  completedCount: number;        // 0~5

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 분석 모드별 이름 매핑
 */
export const MODE_NAMES: Record<AnalysisMode, string> = {
  face: '관상',
  zodiac: '별자리',
  mbti: 'MBTI',
  saju: '사주',
  blood: '혈액형',
  couple: '궁합',
  integrated: '종합',
};

/**
 * 분석 모드별 아이콘 (lucide-react 아이콘 이름)
 */
export const MODE_ICONS: Record<AnalysisMode, string> = {
  face: 'User',
  zodiac: 'Star',
  mbti: 'BrainCircuit',
  saju: 'Calendar',
  blood: 'Droplet',
  couple: 'Heart',
  integrated: 'Sparkles',
};

/**
 * 분석 모드별 설명
 */
export const MODE_DESCRIPTIONS: Record<AnalysisMode, string> = {
  face: '얼굴에 담긴 운명과 기운을 읽습니다',
  zodiac: '별자리로 보는 성격과 운세',
  mbti: 'MBTI 성격 유형 깊이 분석',
  saju: '생년월일시로 풀어보는 사주명리',
  blood: '혈액형으로 보는 성격과 궁합',
  couple: '두 사람의 인연과 궁합',
  integrated: '모든 요소를 종합한 통합 분석',
};
