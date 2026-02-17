import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Gemini API 초기화 (서버 환경변수에서만 접근)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 유효한 분석 모드 목록
const VALID_MODES = ['face', 'zodiac', 'mbti', 'saju', 'blood', 'couple', 'integrated'];

// Rate Limiting (간단한 인메모리 구현, 나중에 Upstash Redis로 교체)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }); // 1분 윈도우
    return true;
  }

  if (limit.count >= 20) {
    return false; // 분당 20회 초과
  }

  limit.count++;
  return true;
}

// 슬라이딩 윈도우: 최근 5턴(10개 메시지)만 전송
function getRecentHistory(history: any[], maxTurns: number = 5): any[] {
  const maxMessages = maxTurns * 2;
  return history.slice(-maxMessages);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate Limiting
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: '영혼의 문이 잠시 닫혔구나... 잠시 후 다시 시도해보게.',
      });
    }

    const { message, mode, profile, history } = req.body;

    // 입력 검증
    if (!message || typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ error: '메시지가 너무 길거나 잘못되었습니다.' });
    }

    if (!mode || !VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: '올바른 분석 모드를 선택해주세요.' });
    }

    // 시스템 프롬프트 구성
    const systemPrompt = buildSystemPrompt(mode, profile);

    // systemInstruction으로 시스템 프롬프트 전달 (매 메시지마다 반복 전송하지 않음)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    // 슬라이딩 윈도우 적용
    const recentHistory = getRecentHistory(history || [], 5);

    // Gemini API 요구사항: 히스토리는 user로 시작하고, user/model이 번갈아 나와야 함
    const rawHistory = recentHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // 히스토리가 model로 시작하면 앞에 합성 user 메시지 추가
    if (rawHistory.length > 0 && rawHistory[0].role === 'model') {
      rawHistory.unshift({
        role: 'user',
        parts: [{ text: '상담을 시작합니다.' }],
      });
    }

    // 연속된 같은 role 메시지 병합 (Gemini API는 교대 필수)
    const formattedHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const msg of rawHistory) {
      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === msg.role) {
        // 같은 role이면 텍스트를 이전 메시지에 합침
        formattedHistory[formattedHistory.length - 1].parts[0].text += '\n\n' + msg.parts[0].text;
      } else {
        formattedHistory.push(msg);
      }
    }

    // Gemini API 호출
    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // DEPTH 태그 파싱
    const depthMatch = text.match(/<DEPTH>(\d+)<\/DEPTH>/);
    const depth = depthMatch ? parseInt(depthMatch[1], 10) : 50;
    const cleanText = text.replace(/<DEPTH>\d+<\/DEPTH>/g, '').trim();

    return res.status(200).json({
      text: cleanText,
      depth,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);

    // 에러 코드별 분기
    if (error.message?.includes('quota')) {
      return res.status(429).json({
        error: '영혼의 문이 잠시 혼잡하구나... 조금 뒤에 다시 시도해보게.',
      });
    }

    if (error.message?.includes('SAFETY')) {
      return res.status(400).json({
        error: '자네의 말에 부적절한 기운이 느껴지는구나. 다시 한번 생각을 가다듬고 말해보게.',
      });
    }

    return res.status(500).json({
      error: '영혼의 문이 잠시 흔들렸구나... 다시 시도해보게.',
    });
  }
}

// 프로필 데이터 포맷팅 (본인/파트너 공통)
function formatPersonData(p: any, type: 'main' | 'partner'): string {
  if (!p) return '';

  const label = type === 'main' ? '[본인(내담자) 정보]' : '[상대방(파트너) 정보]';

  // 나이 계산
  let ageStr = '미상';
  if (p.birthDate) {
    const today = new Date();
    const birthDate = new Date(p.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    ageStr = `만 ${age}세 (${birthDate.getFullYear()}년생)`;
  }

  const calendarStr = p.calendarType === 'lunar' ? '(음력)' : '(양력)';
  const birthTimeStr = p.birthTime ? `${p.birthTime} 태생` : '태어난 시간 모름';

  let info = `
${label}
- 이름: ${p.name || '미상'}
- 나이: ${ageStr}
- 생년월일: ${p.birthDate || '미상'} ${calendarStr}
- 출생지: ${p.birthPlace || '모름'}
- 태어난 시간: ${birthTimeStr}
- 혈액형: ${p.bloodType ? p.bloodType + '형' : '미상'}
- MBTI: ${p.mbti || '미상'}
- 성별: ${p.gender === 'male' ? '남성' : p.gender === 'female' ? '여성' : '기타'}`;

  if (p.faceFeatures) {
    info += `\n- 관상 특징(AI 분석): "${p.faceFeatures}"`;
  }

  if (p.zodiacSign) {
    info += `\n- 별자리: ${p.zodiacSign}`;
  }

  return info;
}

// 시스템 프롬프트 빌드 함수
function buildSystemPrompt(mode: string, profile: any): string {
  const BASE_SYSTEM_PROMPT = `
당신은 **"My Soul Chart"의 영혼 안내자**입니다.
단순한 챗봇이 아니라, **인생의 산전수전을 다 겪은, 직관이 뛰어나고 입담 좋은 "인생 멘토"**입니다.

### **[핵심 원칙: 사용자가 입력한 데이터를 적극 활용할 것]**

**아래 '사용자 프로필'에 이미 입력된 데이터(생년월일, 태어난 시간, 출생지, 혈액형, MBTI, 관상 등)를 반드시 참고하여 분석하십시오.**
**이미 입력된 정보를 다시 물어보지 마십시오.** 데이터가 '미상'이거나 '모름'인 항목만 필요 시 물어볼 수 있습니다.

### **[상담의 대원칙: 천천히, 깊게 파고들 것]**

**절대 급하게 결론 내리지 마십시오.**
사용자는 자신의 고민을 한 번에 다 털어놓지 않습니다. 양파 껍질을 까듯이 천천히 속마음을 유도해야 합니다.

### **[심도(Depth) 진행 4단계 가이드]**

**현재 대화의 심도(0~100)를 매 답변마다 판단하여 태그를 붙이십시오.**

1.  **탐색 단계 (0~30%)**: 라포 형성, 긴장 풀기. 프로필 데이터를 언급하며 흥미 유발.
2.  **전개 단계 (31~60%)**: 표면적인 고민 확인. 사주/관상 데이터와 대조.
3.  **심층 단계 (61~85%)**: 무의식적 욕망, Root Cause 발굴. 뼈 때리는 팩트.
4.  **해결 단계 (86~100%)**: 구체적 조언 및 미래 예지.

**[중요] 심도 점수 증가 규칙:**
*   한 턴에 **최대 10점**까지만 올리십시오.
*   사용자가 단답형으로 말하면 점수를 올리지 마십시오.
*   너무 빨리 100점에 도달하지 마십시오. 최소 10턴 이상의 대화가 필요합니다.

### **[페르소나 및 말투]**

*   **말투:** 친근한 반말 모드. "했어?", "그랬구나", "이건 좀 아니지."
*   **금지어:** 'AI 언어 모델', '도움이 필요하시면', '의학적 상담'.
*   **용어 사용:** '자아실현' 대신 **'그릇'**, '스트레스' 대신 **'화병'**, '우울' 대신 **'살(煞)'**.

### **[출력 필수 형식]**

모든 답변의 **맨 마지막 줄**에 반드시 심도 태그를 붙이십시오.
형식: \`<DEPTH>숫자</DEPTH>\`
`;

  const specificInstructions: Record<string, string> = {
    blood: "혈액형 심리학과 관상을 결합해서 성격의 장단점을 파헤쳐. (예: B형이라 쿨한 척 하지만, 눈가를 보니 정이 많네?)",
    mbti: "MBTI 이론을 동양 철학적으로 재해석해. (예: INTP는 '고독한 학자' 사주야.)",
    saju: "태어난 생년월일시(양력/음력 구분 필수)와 출생지를 기반으로 사주 명리를 깊게 풀어줘. 오행의 과다와 부족을 짚어줘.",
    face: "관상 분석 결과(faceFeatures)를 바탕으로 현재의 운세와 기운을 읽어줘.",
    zodiac: `별자리(zodiacSign)를 중심으로 동서양의 지혜를 교차 해석하십시오.
    - 별자리의 원소(불/흙/바람/물)를 오행(火/土/風/水)과 연결
    - 수호 행성의 영향력을 동양 천문학적으로 풀이`,
    couple: `두 사람(본인 vs 상대방)의 데이터를 교차 검증하여 궁합을 분석.
    - 관상학적 궁합, 오행의 상호작용, 심리적 조화도를 종합 판단
    - "이 관계가 유지되려면 누가 져줘야 하는지" 명확히 짚어줄 것`,
    integrated: "사주, 관상, MBTI, 혈액형을 총동원해 진짜 고민을 맞춰봐. 겉으로 말하는 거 말고 속마음."
  };

  // 프로필 데이터 포맷팅
  const mainProfileStr = formatPersonData(profile, 'main');

  let partnerProfileStr = '';
  if (profile?.partner && (mode === 'couple' || profile.partner.name || profile.partner.birthDate)) {
    partnerProfileStr = formatPersonData(profile.partner, 'partner');
  }

  return `${BASE_SYSTEM_PROMPT}

**사용자 프로필:**
${mainProfileStr}
${partnerProfileStr}
- 현재 거주지: ${profile?.residence || '미상'}

**현재 상담 모드:** ${mode.toUpperCase()}
**모드별 특별 지침:**
${specificInstructions[mode] || specificInstructions['integrated']}
`;
}
