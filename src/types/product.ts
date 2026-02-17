// 상품 타입 정의
export type ProductType =
  | 'face'          // 관상 분석
  | 'saju'          // 사주명리 운세
  | 'zodiac'     // 점성학 (별자리)
  | 'mbti'          // MBTI 인지구조
  | 'bloodtype'     // 혈액형 심리
  | 'couple'        // 커플궁합
  | 'integrated';   // 통합 심층분석

export interface Product {
  id: ProductType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;           // Lucide icon name
  color: {
    from: string;
    to: string;
  };
  badge?: string;          // "인기", "NEW" 등
  price?: number;          // 나중에 결제 기능 추가 시
}

// 상품 목록
export const PRODUCTS: Product[] = [
  {
    id: 'integrated',
    title: '통합 심층분석',
    subtitle: '모든 분석을 한 번에',
    description: '관상, 사주, 점성학, MBTI, 혈액형을 종합하여 당신의 영혼을 깊이 분석합니다.',
    icon: 'BrainCircuit',
    color: {
      from: '#8b5cf6',  // nebula-500
      to: '#60a5fa',    // starlight-500
    },
    badge: '인기',
  },
  {
    id: 'face',
    title: '관상 분석',
    subtitle: '얼굴에 담긴 운명',
    description: '얼굴 사진을 업로드하면 AI가 관상학적 특징을 분석하여 성격과 운세를 알려드립니다.',
    icon: 'Scan',
    color: {
      from: '#a78bfa',  // nebula-400
      to: '#c4b5fd',    // nebula-300
    },
  },
  {
    id: 'saju',
    title: '사주명리 운세',
    subtitle: '하늘이 정한 운명',
    description: '생년월일과 태어난 시간을 바탕으로 사주팔자를 풀이하고 인생의 길을 안내합니다.',
    icon: 'Sparkles',
    color: {
      from: '#14b8a6',  // aurora-500
      to: '#2dd4bf',    // aurora-400
    },
  },
  {
    id: 'zodiac',
    title: '점성학 분석',
    subtitle: '별이 말하는 이야기',
    description: '태어난 시간과 장소를 기반으로 천체의 배치를 분석하여 성격과 운명을 읽습니다.',
    icon: 'Stars',
    color: {
      from: '#60a5fa',  // starlight-500
      to: '#93c5fd',    // starlight-400
    },
  },
  {
    id: 'mbti',
    title: 'MBTI 인지구조',
    subtitle: '마음의 지도',
    description: 'MBTI 유형을 바탕으로 인지 기능과 성격 특성을 심층 분석합니다.',
    icon: 'Brain',
    color: {
      from: '#c4b5fd',  // nebula-300
      to: '#ddd6fe',    // nebula-200
    },
  },
  {
    id: 'bloodtype',
    title: '혈액형 심리',
    subtitle: '혈액이 말해주는 성격',
    description: 'A, B, O, AB형의 심리적 특성과 행동 패턴을 분석합니다.',
    icon: 'Droplet',
    color: {
      from: '#5eead4',  // aurora-300
      to: '#14b8a6',    // aurora-500
    },
  },
  {
    id: 'couple',
    title: '커플 궁합',
    subtitle: '둘만의 운명',
    description: '두 사람의 사주, 별자리, MBTI 등을 종합하여 궁합을 분석합니다.',
    icon: 'Heart',
    color: {
      from: '#a78bfa',  // nebula-400
      to: '#60a5fa',    // starlight-500
    },
    badge: 'NEW',
  },
];
