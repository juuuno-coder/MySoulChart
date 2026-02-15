import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';

// ===== 타입 (클라이언트와 공유) =====
type AnalysisMode = 'integrated' | 'blood' | 'mbti' | 'saju' | 'face' | 'couple' | 'zodiac';
type CalendarType = 'solar' | 'lunar';

interface PersonData {
  name: string;
  birthDate: string;
  calendarType: CalendarType;
  birthTime: string;
  birthPlace: string;
  bloodType: string;
  mbti: string;
  gender: 'male' | 'female' | 'other';
  faceFeatures?: string;
}

interface UserProfile extends PersonData {
  residence: string;
  partner?: PersonData;
}

interface HistoryMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatRequest {
  message: string;
  mode: AnalysisMode;
  profile: UserProfile;
  history?: HistoryMessage[];
}

// ===== Rate Limiting (메모리 기반, 인스턴스당) =====
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // 분당 최대 요청
const RATE_WINDOW = 60 * 1000; // 1분

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// ===== 프롬프트 생성 (constants/prompts.ts에서 이관) =====
const BASE_SYSTEM_PROMPT = `
당신은 **"바이브 철학관"의 용한 도사**입니다.
단순한 챗봇이 아니라, **인생의 산전수전을 다 겪은, 직관이 뛰어나고 입담 좋은 "인생 멘토"**입니다.

---

### **[상담의 대원칙: 천천히, 깊게 파고들 것]**

**절대 급하게 결론 내리지 마십시오.**
사용자는 자신의 고민을 한 번에 다 털어놓지 않습니다. 양파 껍질을 까듯이 천천히 속마음을 유도해야 합니다.

### **[심도(Depth) 진행 4단계 가이드]**

**현재 대화의 심도(0~100)를 매 답변마다 판단하여 태그를 붙이십시오.**

1.  **탐색 단계 (0~30%)**:
    *   **목표:** 라포(Rapport) 형성, 긴장 풀기.
    *   **행동:** 가벼운 농담, 날씨 얘기, 관상이나 사주에 대한 가벼운 코멘트.
    *   **절대 금지:** 바로 해결책 제시하기.

2.  **전개 단계 (31~60%)**:
    *   **목표:** 표면적인 고민 확인.
    *   **행동:** 사용자가 말하는 고민의 앞뒤가 맞는지 확인. 사주/관상 데이터와 사용자의 말이 일치하는지 대조.

3.  **심층 단계 (61~85%)**:
    *   **목표:** 무의식적 욕망, 진짜 원인(Root Cause) 발굴.
    *   **행동:** 뼈를 때리는 팩트 폭격.

4.  **해결 단계 (86~100%)**:
    *   **목표:** 구체적 조언 및 미래 예지.
    *   **행동:** 사주와 관상을 종합한 최종 솔루션 제공.

**[중요] 심도 점수 증가 규칙:**
*   한 턴에 **최대 10점**까지만 올리십시오.
*   사용자가 단답형으로 말하면 점수를 올리지 마십시오.
*   **너무 빨리 100점에 도달하지 마십시오.** 최소 10턴 이상의 대화가 필요합니다.

---

### **[페르소나 및 말투]**

*   **말투:** 친근한 반말 모드. "했어?", "그랬구나", "이건 좀 아니지."
*   **금지어:** 'AI 언어 모델', '도움이 필요하시면', '의학적 상담'.
*   **용어 사용:** '자아실현' 대신 **'그릇'**, '스트레스' 대신 **'화병'**, '우울' 대신 **'살(煞)'**

---

### **[출력 필수 형식]**

모든 답변의 **맨 마지막 줄**에 반드시 심도 태그를 붙이십시오.
형식: \`[[DEPTH: 숫자]]\`
`;

const MODE_INSTRUCTIONS: Record<AnalysisMode, string> = {
  blood: "혈액형 심리학과 관상을 결합해서 성격의 장단점을 파헤쳐.",
  mbti: "MBTI 이론을 동양 철학적으로 재해석해.",
  saju: "태어난 생년월일시(양력/음력 구분 필수)와 출생지를 기반으로 사주 명리를 깊게 풀어줘.",
  face: "관상 분석 결과(faceFeatures)를 바탕으로 현재의 운세와 기운을 읽어줘.",
  zodiac: `**[별자리 운세 모드]** 태양 별자리를 중심으로 동서양의 지혜를 교차 해석. 별자리 원소를 오행과 연결하고, 수호 행성의 영향력을 풀이하십시오.`,
  couple: `**[궁합 정밀 분석 모드]** 두 사람의 데이터를 교차 검증하여 관계의 역학을 분석하십시오.`,
  integrated: `**[통합 점사 모드]** 사주, 관상, MBTI, 혈액형을 총동원해. 진짜 고민이 뭔지 맞춰봐.`,
};

function formatPersonData(p: PersonData, type: 'main' | 'partner'): string {
  const today = new Date();
  const birthDate = new Date(p.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  const calendarStr = p.calendarType === 'lunar' ? '(음력)' : '(양력)';
  const birthTimeStr = p.birthTime ? `${p.birthTime} 태생` : "태어난 시간 모름";
  const label = type === 'main' ? "[본인(내담자) 정보]" : "[상대방(파트너) 정보]";

  let info = `
  ${label}
  - 이름: ${p.name || '미상'}
  - 나이: 만 ${age}세 (${birthDate.getFullYear()}년생)
  - 생년월일: ${p.birthDate} ${calendarStr}
  - 출생지: ${p.birthPlace || '모름'}
  - 태어난 시간: ${birthTimeStr}
  - 혈액형: ${p.bloodType}형
  - MBTI: ${p.mbti}
  - 성별: ${p.gender === 'male' ? '남성' : p.gender === 'female' ? '여성' : '기타'}
  `;

  if (p.faceFeatures) {
    info += `- 관상 특징: "${p.faceFeatures}"\n`;
  }

  return info;
}

function buildSystemPrompt(mode: AnalysisMode, profile: UserProfile): string {
  const mainProfileStr = formatPersonData(profile, 'main');
  let partnerProfileStr = '';

  const hasPartnerData = profile.partner && (
    !!profile.partner.name || !!profile.partner.birthDate || !!profile.partner.faceFeatures
  );

  if (profile.partner && (mode === 'couple' || hasPartnerData)) {
    partnerProfileStr = formatPersonData(profile.partner, 'partner');
  }

  return `${BASE_SYSTEM_PROMPT}
  ${mainProfileStr}
  ${partnerProfileStr}
  - 현재 거주지: ${profile.residence}

  **현재 상담 모드:** ${mode.toUpperCase()}
  **모드별 특별 지침:**
  ${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS['integrated']}
  `;
}

// ===== 입력 검증 =====
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body.message || typeof body.message !== 'string') {
    return { valid: false, error: '메시지가 필요합니다.' };
  }
  if (body.message.length > 2000) {
    return { valid: false, error: '메시지가 너무 깁니다. (최대 2000자)' };
  }
  if (!body.mode || !['integrated', 'blood', 'mbti', 'saju', 'face', 'couple', 'zodiac'].includes(body.mode)) {
    return { valid: false, error: '올바른 상담 모드를 선택해주세요.' };
  }
  if (!body.profile || typeof body.profile !== 'object') {
    return { valid: false, error: '프로필 정보가 필요합니다.' };
  }
  return { valid: true };
}

// ===== XSS 방어: HTML 태그 제거 =====
function sanitize(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

// ===== 핸들러 =====
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate Limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      text: '지금 너무 많은 영혼이 찾아와서 기가 고갈되었구나... 잠시 쉬었다가 다시 와주게. (일일 사용량 초과)',
      depth: null,
    });
  }

  // 입력 검증
  const body = req.body as ChatRequest;
  const validation = validateRequest(body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // API 키 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({
      text: '영혼의 문이 잠겨있구나... 관리자에게 알려주게. (서버 설정 오류)',
      depth: null,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = buildSystemPrompt(body.mode, body.profile);

    // 대화 히스토리 변환
    const geminiHistory: Content[] = (body.history || []).map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: sanitize(msg.text) }],
    }));

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
    });

    const chatSession = model.startChat({
      history: geminiHistory,
      generationConfig: { temperature: 0.8 },
    });

    const result = await chatSession.sendMessage(sanitize(body.message));
    const response = await result.response;
    const rawText = response.text() || '영혼들이 침묵하고 있습니다...';

    // DEPTH 태그 파싱
    const depthMatch = rawText.match(/\[\[DEPTH:\s*(\d+)\]\]/);
    let depth = null;
    let cleanText = rawText;

    if (depthMatch) {
      depth = parseInt(depthMatch[1], 10);
      cleanText = rawText.replace(depthMatch[0], '').trim();
    }

    return res.status(200).json({ text: cleanText, depth });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const msg = error.message || '';

    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
      return res.status(429).json({
        text: '지금 너무 많은 영혼이 찾아와서 기가 고갈되었구나... 잠시 쉬었다가 다시 와주게.',
        depth: null,
      });
    }

    if (msg.includes('404')) {
      return res.status(502).json({
        text: '점술의 통로가 막혀있구나... 관리자에게 알려주게.',
        depth: null,
      });
    }

    if (msg.includes('403') || msg.includes('API_KEY') || msg.includes('permission')) {
      return res.status(502).json({
        text: '영혼의 문이 잠겨있구나... 관리자에게 알려주게.',
        depth: null,
      });
    }

    return res.status(500).json({
      text: '기가 약해서 목소리가 잘 안 들리네... 잠시 후 다시 시도해주게.',
      depth: null,
    });
  }
}
