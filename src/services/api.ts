import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisMode, Message, UserProfile } from '../types';
import { CardData } from '../types/card';
import { SoulChartData } from '../types/chart';
import { GET_MODE_PROMPT, GET_GREETING_TRIGGER } from '../constants/prompts';

// 로컬 개발 환경 감지
const IS_LOCAL_DEV = import.meta.env.DEV;
const API_BASE_URL = IS_LOCAL_DEV ? 'http://localhost:3304/api' : '/api';

// 로컬 개발용 Gemini API (VITE_GEMINI_API_KEY 사용)
let localGenAI: GoogleGenerativeAI | null = null;
let localModel: any = null;

if (IS_LOCAL_DEV && import.meta.env.VITE_GEMINI_API_KEY) {
  localGenAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  localModel = localGenAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  console.log('[DEV] Using local Gemini API (client-side)');
}

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
 * 로컬 개발용: 클라이언트에서 직접 Gemini API 호출
 */
async function sendMessageLocal(
  message: string,
  mode: AnalysisMode,
  profile: UserProfile,
  history: Message[]
): Promise<{ text: string; depth: number }> {
  if (!localModel) {
    throw new Error('로컬 Gemini API가 초기화되지 않았습니다');
  }

  const systemPrompt = GET_MODE_PROMPT(mode, profile);

  const chatHistory = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const chat = localModel.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: '알겠습니다. 시스템 프롬프트를 반영하여 답변하겠습니다.' }],
      },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  const rawText = response.text();

  const { cleanText, depth } = parseDepth(rawText);

  return { text: cleanText, depth };
}

/**
 * 로컬 개발용: 클라이언트에서 직접 관상 분석
 */
async function analyzeFaceLocal(imageBase64: string): Promise<{
  faceShape: string;
  forehead: string;
  eyes: string;
  nose: string;
  mouth: string;
  chin: string;
}> {
  if (!localGenAI) {
    throw new Error('로컬 Gemini API가 초기화되지 않았습니다');
  }

  const visionModel = localGenAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const imageData = imageBase64.split(',')[1] || imageBase64;

  const prompt = `
당신은 수천 년간 관상을 보아온 신비로운 도사입니다.

이 사진 속 인물의 관상을 분석하여 다음 특징들을 판단해주세요:

1. 얼굴형: (둥근형 / 계란형 / 각진형 / 역삼각형 / 긴형)
2. 이마: (넓음 / 보통 / 좁음)
3. 눈: (큰 눈 / 중간 눈 / 작은 눈)
4. 코: (높은 코 / 보통 코 / 낮은 코)
5. 입: (큰 입 / 보통 입 / 작은 입)
6. 턱: (강한 턱 / 보통 턱 / 둥근 턱)

응답은 반드시 다음 JSON 형식으로만 답변하세요:
{
  "faceShape": "...",
  "forehead": "...",
  "eyes": "...",
  "nose": "...",
  "mouth": "...",
  "chin": "..."
}
`;

  const result = await visionModel.generateContent([
    prompt,
    {
      inlineData: {
        data: imageData,
        mimeType: 'image/jpeg',
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 응답을 파싱할 수 없습니다.');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Gemini API를 통해 메시지 전송
 * @param message 사용자 메시지
 * @param mode 분석 모드
 * @param profile 사용자 프로필
 * @param history 대화 히스토리
 * @returns AI 응답 및 심도 점수
 */
export async function sendMessage(
  message: string,
  mode: AnalysisMode,
  profile: UserProfile,
  history: Message[],
  soulChart?: SoulChartData
): Promise<{ text: string; depth: number }> {
  // 로컬 개발: 클라이언트에서 직접 호출
  if (IS_LOCAL_DEV && localModel) {
    try {
      return await sendMessageLocal(message, mode, profile, history);
    } catch (error: any) {
      console.error('[DEV] Local Gemini API Error:', error);
      throw error;
    }
  }

  // 프로덕션: Serverless Functions 호출
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

    // Q&A 모드: soulChart 데이터 전달
    if (soulChart) {
      body.soulChart = soulChart;
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '서버 오류가 발생했습니다');
    }

    const data = await response.json();
    return {
      text: data.text,
      depth: data.depth,
    };
  } catch (error: any) {
    console.error('API Error:', error);
    throw new Error(error.message || '통신 오류가 발생했습니다');
  }
}

/**
 * 관상 분석 (이미지 업로드)
 * @param imageBase64 Base64 인코딩된 이미지
 * @returns 관상 특징 데이터
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
}> {
  // 로컬 개발: 클라이언트에서 직접 호출
  if (IS_LOCAL_DEV && localGenAI) {
    try {
      return await analyzeFaceLocal(imageBase64);
    } catch (error: any) {
      console.error('[DEV] Local Face Analysis Error:', error);
      throw error;
    }
  }

  // 프로덕션: Serverless Functions 호출
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
 * @param mode 분석 모드
 * @param profile 사용자 프로필
 * @returns 인사말 및 심도 점수
 */
export async function initializeSession(
  mode: AnalysisMode,
  profile: UserProfile
): Promise<{ text: string; depth: number }> {
  try {
    const greetingTrigger = GET_GREETING_TRIGGER(mode);

    const response = await sendMessage(
      greetingTrigger,
      mode,
      profile,
      []
    );

    return response;
  } catch (error: any) {
    console.error('Session Initialization Error:', error);
    // 실패 시 기본 인사말 반환
    return {
      text: '어서 와요. 얼굴을 딱 보니... 뭔가 답답한 게 꽉 막혀있는 거 같은데?',
      depth: 10,
    };
  }
}

/**
 * 로컬 개발용: 클라이언트에서 직접 카드 데이터 생성
 */
async function generateCardLocal(
  mode: AnalysisMode,
  profile: Partial<UserProfile>,
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
  depthScore: number
): Promise<CardData> {
  if (!localModel) {
    throw new Error('로컬 Gemini API가 초기화되지 않았습니다');
  }

  // 대화 내용 요약
  const conversationText = conversationHistory
    .map((msg) => `${msg.role === 'user' ? '내담자' : '도사'}: ${msg.text}`)
    .join('\n\n');

  // 카드 데이터 생성 프롬프트
  const prompt = `
당신은 지금까지의 상담 내용을 바탕으로 **영혼 차트 결과 카드**를 만들어야 합니다.

**내담자 정보:**
- 이름: ${profile.name}
- 생년월일: ${profile.birthDate || '미입력'}
- 별자리: ${profile.zodiacSign || '미입력'}
- MBTI: ${profile.mbti || '미입력'}
- 혈액형: ${profile.bloodType || '미입력'}

**상담 모드:** ${mode.toUpperCase()}

**대화 내용:**
${conversationText}

**심도 점수:** ${depthScore}/100

---

위 상담 내용을 바탕으로, 내담자의 영혼을 한 장의 카드로 요약해주세요.

**응답 형식 (JSON만 출력, 다른 텍스트 없이):**

\`\`\`json
{
  "headline": "한 줄 헤드라인 (예: 불꽃의 그릇을 가진 사람, 물의 흐름을 읽는 자)",
  "traits": [
    "성격 특성 1 (예: 직관력이 뛰어남)",
    "성격 특성 2 (예: 감정이 풍부함)",
    "성격 특성 3",
    "성격 특성 4",
    "성격 특성 5"
  ],
  "advice": "핵심 조언 1-2문장 (예: 지금은 내면의 소리에 귀 기울일 때입니다. 급하게 결정하지 마세요.)",
  "luckyItems": {
    "color": "행운의 색 (예: 청록색)",
    "number": 행운의 숫자 (1~99 정수),
    "direction": "행운의 방향 (예: 동쪽)"
  }
}
\`\`\`

**중요:**
- JSON 형식을 정확히 지켜주세요
- headline은 15자 이내로 간결하게
- traits는 정확히 5개
- advice는 100자 이내
- 도사 페르소나를 유지하되, 카드에 어울리는 고급스러운 표현 사용
`;

  const result = await localModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // JSON 파싱
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 응답을 파싱할 수 없습니다');
  }

  const jsonText = jsonMatch[1] || jsonMatch[0];
  const parsedData = JSON.parse(jsonText);

  // CardData 구성
  const cardData: CardData = {
    userName: profile.name || '도인',
    mode,
    zodiacSign: profile.zodiacSign,
    headline: parsedData.headline,
    traits: parsedData.traits,
    advice: parsedData.advice,
    luckyItems: parsedData.luckyItems,
    depthScore,
    createdAt: new Date(),
  };

  return cardData;
}

/**
 * 대화 히스토리를 분석하여 결과 카드 데이터 생성
 * @param mode 분석 모드
 * @param profile 사용자 프로필
 * @param conversationHistory 대화 히스토리
 * @param depthScore 심도 점수
 * @returns 카드 데이터
 */
export async function generateCard(
  mode: AnalysisMode,
  profile: Partial<UserProfile>,
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
  depthScore: number
): Promise<CardData> {
  // 로컬 개발: 클라이언트에서 직접 호출
  if (IS_LOCAL_DEV && localModel) {
    try {
      return await generateCardLocal(mode, profile, conversationHistory, depthScore);
    } catch (error: any) {
      console.error('[DEV] Local Card Generation Error:', error);
      throw error;
    }
  }

  // 프로덕션: Serverless Functions 호출
  try {
    const response = await fetch(`${API_BASE_URL}/generate-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode,
        profile,
        conversationHistory,
        depthScore,
      }),
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
 * 5개 개별 분석을 종합하여 영혼 차트 생성
 * @param profile 사용자 프로필
 * @param analyses 개별 분석 결과 (모드 → CardData)
 * @returns 종합 영혼 차트 데이터
 */
export async function generateSoulChart(
  profile: Partial<UserProfile>,
  analyses: Record<string, CardData>,
): Promise<SoulChartData> {
  // 로컬 개발: 클라이언트에서 직접 호출
  if (IS_LOCAL_DEV && localModel) {
    try {
      return await generateSoulChartLocal(profile, analyses);
    } catch (error: any) {
      console.error('[DEV] Local Soul Chart Generation Error:', error);
      throw error;
    }
  }

  // 프로덕션: Serverless Functions 호출
  try {
    const response = await fetch(`${API_BASE_URL}/generate-soul-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
 * 통합 상담 대화에서 직접 영혼 차트 생성 (unified 모드)
 */
export async function generateSoulChartFromConversation(
  profile: Partial<UserProfile>,
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
): Promise<SoulChartData> {
  // 로컬 개발
  if (IS_LOCAL_DEV && localModel) {
    return generateSoulChartFromConversationLocal(profile, conversationHistory);
  }

  // 프로덕션
  const response = await fetch(`${API_BASE_URL}/generate-soul-chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile,
      conversationHistory,
      mode: 'unified',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '영혼 차트 생성 오류가 발생했습니다');
  }

  const data = await response.json();
  return data.soulChart;
}

/**
 * 로컬 개발용: 대화 기반 영혼 차트 생성
 */
async function generateSoulChartFromConversationLocal(
  profile: Partial<UserProfile>,
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
): Promise<SoulChartData> {
  if (!localModel) {
    throw new Error('로컬 Gemini API가 초기화되지 않았습니다');
  }

  const conversationText = conversationHistory
    .map((msg) => `${msg.role === 'user' ? '내담자' : '도사'}: ${msg.text}`)
    .join('\n\n');

  const prompt = `
당신은 영혼 차트 마스터입니다.
아래 통합 상담 대화를 분석하여 영혼 차트를 완성하세요.

**내담자 정보:**
- 이름: ${profile.name}
- 생년월일: ${profile.birthDate || '미입력'}
- MBTI: ${profile.mbti || '미입력'}
- 혈액형: ${profile.bloodType || '미입력'}

**통합 상담 대화:**
${conversationText}

---

\`\`\`json
{
  "soulType": "영혼 유형 이름 (4-8글자)",
  "soulDescription": "영혼 유형 상세 설명 (3-5문장)",
  "dimensions": { "intuition": 0-100, "emotion": 0-100, "logic": 0-100, "social": 0-100, "creativity": 0-100 },
  "coreTraits": ["핵심 성격 특성 5-7개"],
  "hiddenDesire": "이 사람이 진짜로 원하는 것",
  "lifeAdvice": "인생 조언 2-3문장",
  "luckyElements": { "color": "행운의 색상", "number": 1-99, "direction": "행운의 방향", "season": "행운의 계절", "element": "오행 주 원소" }
}
\`\`\`
`;

  const result = await localModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 응답을 파싱할 수 없습니다');
  }

  const jsonText = jsonMatch[1] || jsonMatch[0];
  const parsedData = JSON.parse(jsonText);
  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));

  return {
    soulType: parsedData.soulType,
    soulDescription: parsedData.soulDescription,
    dimensions: {
      intuition: clamp(parsedData.dimensions?.intuition || 50),
      emotion: clamp(parsedData.dimensions?.emotion || 50),
      logic: clamp(parsedData.dimensions?.logic || 50),
      social: clamp(parsedData.dimensions?.social || 50),
      creativity: clamp(parsedData.dimensions?.creativity || 50),
    },
    coreTraits: (parsedData.coreTraits || []).slice(0, 7),
    hiddenDesire: parsedData.hiddenDesire || '',
    lifeAdvice: parsedData.lifeAdvice || '',
    luckyElements: {
      color: parsedData.luckyElements?.color || '청록색',
      number: clamp(parsedData.luckyElements?.number || 7, 1, 99),
      direction: parsedData.luckyElements?.direction || '동쪽',
      season: parsedData.luckyElements?.season || '봄',
      element: parsedData.luckyElements?.element || '木',
    },
    createdAt: new Date(),
    includesCouple: false,
  };
}

/**
 * 로컬 개발용: 클라이언트에서 직접 영혼 차트 생성
 */
async function generateSoulChartLocal(
  profile: Partial<UserProfile>,
  analyses: Record<string, CardData>,
): Promise<SoulChartData> {
  if (!localModel) {
    throw new Error('로컬 Gemini API가 초기화되지 않았습니다');
  }

  const modeNames: Record<string, string> = {
    face: '관상', zodiac: '별자리', mbti: 'MBTI',
    saju: '사주명리', blood: '혈액형', couple: '커플 궁합',
  };

  const analysisTexts = Object.entries(analyses)
    .map(([mode, data]) => {
      return `[${modeNames[mode] || mode} 분석 결과]
headline: "${data.headline}"
traits: ${(data.traits || []).join(', ')}
advice: "${data.advice}"
depthScore: ${data.depthScore || 100}`;
    })
    .join('\n\n');

  const prompt = `
당신은 영혼 차트 마스터입니다.
아래 분석 결과를 종합하여 이 사람의 영혼 차트를 완성하세요.

**내담자 정보:**
- 이름: ${profile.name}
- 생년월일: ${profile.birthDate || '미입력'}
- MBTI: ${profile.mbti || '미입력'}
- 혈액형: ${profile.bloodType || '미입력'}

**개별 분석 결과:**
${analysisTexts}

---

위 데이터를 교차 검증하고 종합하여, 다음 JSON을 생성하세요.

\`\`\`json
{
  "soulType": "영혼 유형 이름 (4-8글자)",
  "soulDescription": "영혼 유형 상세 설명 (3-5문장)",
  "dimensions": {
    "intuition": 0-100,
    "emotion": 0-100,
    "logic": 0-100,
    "social": 0-100,
    "creativity": 0-100
  },
  "coreTraits": ["핵심 성격 특성 5-7개"],
  "hiddenDesire": "이 사람이 진짜로 원하는 것",
  "lifeAdvice": "인생 조언 2-3문장",
  "luckyElements": {
    "color": "행운의 색상",
    "number": 1-99,
    "direction": "행운의 방향",
    "season": "행운의 계절",
    "element": "오행 주 원소 (木/火/土/金/水)"
  }
}
\`\`\`
`;

  const result = await localModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 응답을 파싱할 수 없습니다');
  }

  const jsonText = jsonMatch[1] || jsonMatch[0];
  const parsedData = JSON.parse(jsonText);

  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));

  return {
    soulType: parsedData.soulType,
    soulDescription: parsedData.soulDescription,
    dimensions: {
      intuition: clamp(parsedData.dimensions?.intuition || 50),
      emotion: clamp(parsedData.dimensions?.emotion || 50),
      logic: clamp(parsedData.dimensions?.logic || 50),
      social: clamp(parsedData.dimensions?.social || 50),
      creativity: clamp(parsedData.dimensions?.creativity || 50),
    },
    coreTraits: (parsedData.coreTraits || []).slice(0, 7),
    hiddenDesire: parsedData.hiddenDesire || '',
    lifeAdvice: parsedData.lifeAdvice || '',
    luckyElements: {
      color: parsedData.luckyElements?.color || '청록색',
      number: clamp(parsedData.luckyElements?.number || 7, 1, 99),
      direction: parsedData.luckyElements?.direction || '동쪽',
      season: parsedData.luckyElements?.season || '봄',
      element: parsedData.luckyElements?.element || '木',
    },
    createdAt: new Date(),
    includesCouple: !!analyses.couple,
  };
}
