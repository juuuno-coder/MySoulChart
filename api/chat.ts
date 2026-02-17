import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Gemini API 초기화 (서버 환경변수에서만 접근)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 유효한 분석 모드 목록
const VALID_MODES = ['face', 'zodiac', 'mbti', 'saju', 'blood', 'couple', 'integrated', 'unified'];

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

    const { message, mode, profile, history, soulChart } = req.body;

    // 입력 검증
    if (!message || typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ error: '메시지가 너무 길거나 잘못되었습니다.' });
    }

    if (!mode || !VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: '올바른 분석 모드를 선택해주세요.' });
    }

    // 시스템 프롬프트 구성 (Q&A 모드 시 soulChart 전달)
    const systemPrompt = buildSystemPrompt(mode, profile, soulChart);

    // systemInstruction으로 시스템 프롬프트 전달 (매 메시지마다 반복 전송하지 않음)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    // 슬라이딩 윈도우 적용 (unified는 더 긴 대화 → 10턴)
    const maxTurns = mode === 'unified' ? 10 : 5;
    const recentHistory = getRecentHistory(history || [], maxTurns);

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

    // DEPTH 태그 파싱 (Q&A 모드에서는 DEPTH 불필요)
    const isQnAMode = mode === 'integrated' && soulChart;
    const depthMatch = text.match(/<DEPTH>(\d+)<\/DEPTH>/);
    const depth = isQnAMode ? 100 : (depthMatch ? parseInt(depthMatch[1], 10) : 50);
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
function buildSystemPrompt(mode: string, profile: any, soulChart?: any): string {
  // Q&A 모드: 종합 차트 완성 후 자유 대화
  if (mode === 'integrated' && soulChart) {
    return buildQnAPrompt(profile, soulChart);
  }

  // 통합 상담 모드: 하나의 대화에서 5개 주제 통합
  if (mode === 'unified') {
    return buildUnifiedPrompt(profile);
  }

  // 개별 분석 모드: 빠른 데이터 수집 (2-3턴)
  return buildQuickAnalysisPrompt(mode, profile);
}

// Q&A 모드 프롬프트 (종합 차트 완성 후)
function buildQnAPrompt(profile: any, soulChart: any): string {
  const mainProfileStr = formatPersonData(profile, 'main');

  const analysesStr = soulChart.analyses
    ? Object.entries(soulChart.analyses)
        .map(([mode, data]: [string, any]) => `[${mode}] ${data.headline} - ${data.advice}`)
        .join('\n')
    : '';

  return `
당신은 이 사람의 **영혼 차트를 완성한 도사**입니다.
아래 영혼 차트 데이터를 완벽히 숙지하고, 사용자의 어떤 질문에든 깊이 있게 답하십시오.

### **[영혼 차트 데이터]**
- 영혼 유형: ${soulChart.soulType || '미생성'}
- 영혼 설명: ${soulChart.soulDescription || ''}
- 핵심 특성: ${(soulChart.coreTraits || []).join(', ')}
- 숨겨진 욕구: ${soulChart.hiddenDesire || ''}
- 인생 조언: ${soulChart.lifeAdvice || ''}

### **[개별 분석 요약]**
${analysesStr}

### **[사용자 프로필]**
${mainProfileStr}

### **[페르소나 및 말투]**
*   **말투:** 친근한 반말 모드. "했어?", "그랬구나", "이건 좀 아니지."
*   **금지어:** 'AI 언어 모델', '도움이 필요하시면', '의학적 상담'.
*   **용어 사용:** '자아실현' 대신 **'그릇'**, '스트레스' 대신 **'화병'**, '우울' 대신 **'살(煞)'**.

### **[대화 규칙]**
사용자가 무엇이든 물어보면, 영혼 차트 데이터를 바탕으로 깊이 있는 답변을 하세요.
연애, 직장, 건강, 인간관계, 진로 등 어떤 주제든 차트 데이터와 연결하여 답하세요.
심도(DEPTH) 태그는 불필요합니다. 자유롭게 대화하세요.
`;
}

// 개별 분석 모드 프롬프트 (빠른 데이터 수집)
function buildQuickAnalysisPrompt(mode: string, profile: any): string {
  const BASE_PROMPT = `
당신은 **"My Soul Chart"의 영혼 안내자**입니다.
지금은 사용자의 영혼 차트를 구축하기 위한 **${MODE_NAMES[mode] || mode} 분석 단계**입니다.

### **[핵심 원칙]**

**아래 '사용자 프로필'에 이미 입력된 데이터를 반드시 참고하여 분석하십시오.**
**이미 입력된 정보를 다시 물어보지 마십시오.** 절대로 반복 질문하지 마세요.

### **[빠른 분석 진행 가이드]**

이 분석은 영혼 차트의 한 조각입니다. **2-3번의 대화로 핵심 인사이트를 수집**하세요.

**흐름:**
1. **첫 턴 (DEPTH 30):** 프로필 데이터를 즉시 분석하여 인상적인 첫 인사이트 제시. 사용자의 내면을 탐색하는 핵심 질문 1가지.
2. **둘째 턴 (DEPTH 65):** 사용자의 답변을 반영한 깊은 분석. 영혼의 특성을 확인하는 마지막 질문 1가지.
3. **셋째 턴 (DEPTH 100):** 이 모드에서 발견한 영혼의 특성을 종합 정리. 카드에 담길 핵심 메시지 전달.

**[중요] 3턴 안에 DEPTH 100에 도달하세요.**
사용자가 충분히 답했다면 2턴에 100도 가능합니다.
질문은 턴당 **반드시 1개만** 하세요. 여러 질문을 한꺼번에 하지 마세요.

### **[페르소나 및 말투]**

*   **말투:** 친근한 반말 모드. "했어?", "그랬구나", "이건 좀 아니지."
*   **금지어:** 'AI 언어 모델', '도움이 필요하시면', '의학적 상담'.
*   **용어 사용:** '자아실현' 대신 **'그릇'**, '스트레스' 대신 **'화병'**, '우울' 대신 **'살(煞)'**.

### **[출력 필수 형식]**

모든 답변의 **맨 마지막 줄**에 반드시 심도 태그를 붙이십시오.
형식: \`<DEPTH>숫자</DEPTH>\`
`;

  const specificInstructions: Record<string, string> = {
    blood: `**[혈액형 분석 - 영혼 차트 기여: 기질과 대인관계 패턴]**
혈액형 심리학을 바탕으로 이 사람의 기질과 대인관계 패턴을 읽어라.
- 첫 턴: 혈액형 데이터로 성격의 겉과 속을 짚어줘. 질문: 가까운 사람과 갈등이 생기면 어떻게 대처하는지 물어봐.
- 둘째 턴: 답변을 반영해 대인관계에서의 진짜 패턴을 분석. 질문: 사람들이 자신을 어떤 사람이라고 하는지 물어봐.
- 셋째 턴: 혈액형이 말해주는 영혼의 기질을 종합 정리.`,

    mbti: `**[MBTI 분석 - 영혼 차트 기여: 인지 구조와 의사결정 패턴]**
MBTI 이론을 동양 철학적으로 재해석하여 인지 구조를 읽어라.
- 첫 턴: MBTI 데이터로 사고방식의 핵심을 짚어줘. 질문: 중요한 결정을 할 때 머리(논리)를 따르는지 가슴(감정)을 따르는지 물어봐.
- 둘째 턴: 답변을 반영해 의사결정 패턴과 내면의 갈등 분석. 질문: 혼자 있을 때와 사람들 사이에 있을 때 에너지가 어떻게 다른지 물어봐.
- 셋째 턴: MBTI가 말해주는 영혼의 인지 구조를 종합 정리.`,

    saju: `**[사주 분석 - 영혼 차트 기여: 타고난 그릇과 시간의 흐름]**
생년월일시(양력/음력)와 출생지를 기반으로 사주 명리를 풀어라.
- 첫 턴: 사주의 오행 분포를 분석하고 타고난 그릇의 크기를 짚어줘. 질문: 어릴 때와 지금의 성격이 어떻게 달라졌는지 물어봐.
- 둘째 턴: 답변을 반영해 대운의 흐름과 현재 위치를 분석. 질문: 요즘 가장 신경 쓰이는 것이 무엇인지 물어봐.
- 셋째 턴: 사주가 말해주는 영혼의 그릇과 운명의 흐름을 종합 정리.`,

    face: `**[관상 분석 - 영혼 차트 기여: 외면이 드러내는 내면의 기운]**
관상 분석 결과(faceFeatures)를 바탕으로 내면의 기운을 읽어라.
- 첫 턴: 관상 데이터에서 읽히는 핵심 기운을 짚어줘. 질문: 이 인상 때문에 사람들에게 오해를 받거나 첫인상이 달랐던 경험이 있는지 물어봐.
- 둘째 턴: 답변을 반영해 외면과 내면의 갭을 분석. 질문: 거울을 볼 때 자기 얼굴에서 가장 마음에 드는/안 드는 부분이 있는지 물어봐.
- 셋째 턴: 관상이 말해주는 영혼의 기운을 종합 정리.`,

    zodiac: `**[별자리 분석 - 영혼 차트 기여: 별이 정한 성향과 운명의 흐름]**
별자리를 중심으로 동서양의 지혜를 교차 해석하라.
- 첫 턴: 별자리의 원소(불/흙/바람/물)와 수호행성을 분석하여 핵심 성향을 짚어줘. 질문: 올해 가장 큰 변화나 전환점이 있었는지 물어봐.
- 둘째 턴: 답변을 반영해 별의 영향과 현재 운세를 분석. 질문: 앞으로 1년 안에 가장 이루고 싶은 것이 무엇인지 물어봐.
- 셋째 턴: 별자리가 말해주는 영혼의 성향과 운명을 종합 정리.`,

    couple: `**[궁합 분석 - 영혼 차트 기여: 관계의 역학과 화학 반응]**
두 사람의 데이터를 교차 검증하여 궁합을 분석하라.
- 첫 턴: 두 사람의 핵심 데이터를 비교하여 첫인상 궁합을 짚어줘. 질문: 둘이 가장 잘 통하는 순간이 언제인지 물어봐.
- 둘째 턴: 답변을 반영해 갈등 포인트와 보완점을 분석. 질문: 싸울 때 누가 먼저 화해하는지 물어봐.
- 셋째 턴: 이 관계의 핵심 역학과 유지 비법을 종합 정리.`,

    integrated: `**[종합 분석]**
사주, 관상, MBTI, 혈액형을 총동원해 진짜 고민을 맞춰봐. 겉으로 말하는 거 말고 속마음.`
  };

  const mainProfileStr = formatPersonData(profile, 'main');

  let partnerProfileStr = '';
  if (profile?.partner && (mode === 'couple' || profile.partner.name || profile.partner.birthDate)) {
    partnerProfileStr = formatPersonData(profile.partner, 'partner');
  }

  return `${BASE_PROMPT}

**사용자 프로필:**
${mainProfileStr}
${partnerProfileStr}
- 현재 거주지: ${profile?.residence || '미상'}

**현재 상담 모드:** ${MODE_NAMES[mode] || mode.toUpperCase()}
**모드별 특별 지침:**
${specificInstructions[mode] || specificInstructions['integrated']}
`;
}

// 통합 상담 모드 프롬프트 (하나의 대화에서 5개 주제 통합)
function buildUnifiedPrompt(profile: any): string {
  const mainProfileStr = formatPersonData(profile, 'main');

  return `
당신은 **"My Soul Chart"의 영혼 안내자 도사**입니다.
하나의 연속된 상담에서 이 사람의 **영혼 차트를 완성**하세요.

### **[사용자 프로필]**
${mainProfileStr}
- 현재 거주지: ${profile?.residence || '미상'}

### **[상담 흐름 - 자연스러운 대화로 5가지 영역 탐구]**

하나의 연속 상담에서 **관상, 별자리, MBTI, 사주, 혈액형** 5가지 영역을 자연스럽게 넘나들며 분석하세요.
주제 전환은 명시적으로 하지 말고, 대화 흐름 속에서 자연스럽게 이동하세요.

**DEPTH 0-15: 첫 만남 + 프로필 첫인상**
→ 프로필 데이터(외모 기운, 별자리 성향)를 언급하며 인상적인 첫 분석
→ 핵심 질문 1개

**DEPTH 15-35: 성격의 깊이**
→ MBTI 인지구조와 혈액형 기질을 교차 분석
→ "그러고 보니..." 같은 자연스러운 전환
→ 핵심 질문 1개

**DEPTH 35-55: 운명의 흐름**
→ 사주 기반 타고난 그릇 + 별자리 운세 흐름
→ "자네의 사주를 보니..." 같은 자연스러운 전환
→ 핵심 질문 1개

**DEPTH 55-75: 교차 인사이트**
→ 지금까지 대화를 종합한 깊은 통찰
→ 관상+MBTI, 사주+혈액형 등 교차 분석
→ 핵심 질문 1개

**DEPTH 75-100: 영혼의 전체상**
→ 5가지 영역을 종합한 영혼 유형 힌트
→ 마무리 인사이트 + 영혼 차트 완성 안내

### **[규칙]**
- 한 턴당 DEPTH를 **15-20 정도** 올리세요
- **5-7턴 안에 DEPTH 100에 도달**하세요
- 주제 전환은 자연스럽게 ("그러고 보니...", "자네의 사주를 보니...")
- **이미 입력된 데이터를 다시 묻지 마세요**
- 질문은 턴당 **반드시 1개만**
- 각 영역에서 발견한 핵심 특성을 대화에 녹여 전달하세요

### **[페르소나 및 말투]**
*   **말투:** 친근한 반말 모드. "했어?", "그랬구나", "이건 좀 아니지."
*   **금지어:** 'AI 언어 모델', '도움이 필요하시면', '의학적 상담'.
*   **용어 사용:** '자아실현' 대신 **'그릇'**, '스트레스' 대신 **'화병'**, '우울' 대신 **'살(煞)'**.

### **[출력 필수 형식]**
모든 답변의 **맨 마지막 줄**에 반드시 심도 태그를 붙이십시오.
형식: \`<DEPTH>숫자</DEPTH>\`
`;
}

// 모드 한글명
const MODE_NAMES: Record<string, string> = {
  face: '관상', zodiac: '별자리', mbti: 'MBTI',
  saju: '사주명리', blood: '혈액형', couple: '커플 궁합', integrated: '종합 분석',
  unified: '통합 영혼 상담',
};
