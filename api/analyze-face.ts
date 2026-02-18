import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Gemini API 초기화 (Vision 모델)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
    const { imageBase64 } = req.body;

    // 입력 검증
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
    }

    // Base64 크기 제한 (5MB)
    if (imageBase64.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: '이미지 크기가 너무 큽니다 (최대 5MB).' });
    }

    // Gemini Vision API 호출 (얼굴 검증 + 관상 분석)
    const prompt = `
당신은 이미지 분석 전문가입니다. 아래 두 단계를 순서대로 수행하세요.

## 1단계: 사람 얼굴 검증
이 사진에 사람의 얼굴이 명확하게 보이는지 판단하세요.
- 사람이 아닌 것(동물, 풍경, 물건, 캐릭터, 그림, 음식 등)이면 실패입니다.
- 얼굴이 너무 작거나 가려져서 관상 분석이 불가능하면 실패입니다.
- AI가 생성한 이미지여도 사람 얼굴 형태가 보이면 통과입니다.

## 2단계: 관상 분석 (1단계 통과 시에만)
사진 속 인물의 관상을 분석하여 다음 특징들을 판단하세요:
1. 얼굴형: (둥근형 / 계란형 / 각진형 / 역삼각형 / 긴형)
2. 이마: (넓음 / 보통 / 좁음)
3. 눈: (큰 눈 / 중간 눈 / 작은 눈)
4. 코: (높은 코 / 보통 코 / 낮은 코)
5. 입: (큰 입 / 보통 입 / 작은 입)
6. 턱: (강한 턱 / 보통 턱 / 둥근 턱)

## 응답 형식 (반드시 JSON만 출력)

1단계 실패 시:
{
  "isHumanFace": false,
  "reason": "사진에서 감지된 내용 (예: 고양이, 풍경 등)"
}

1단계 통과 시:
{
  "isHumanFace": true,
  "faceShape": "...",
  "forehead": "...",
  "eyes": "...",
  "nose": "...",
  "mouth": "...",
  "chin": "..."
}
`;

    const imageParts = [
      {
        inlineData: {
          data: imageBase64.split(',')[1] || imageBase64,
          mimeType: 'image/jpeg',
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 얼굴 검증 실패
    if (!parsed.isHumanFace) {
      return res.status(400).json({
        error: `이 사진에서는 사람의 얼굴이 보이지 않는구나. ${parsed.reason ? `(${parsed.reason})` : ''} 본인의 얼굴이 잘 보이는 정면 사진을 올려주게.`,
      });
    }

    // 검증 통과 → 관상 데이터만 추출
    const { isHumanFace, ...features } = parsed;

    return res.status(200).json({ features });
  } catch (error: any) {
    console.error('Gemini Vision API Error:', error);

    if (error.message?.includes('SAFETY')) {
      return res.status(400).json({
        error: '사진에서 부적절한 내용이 감지되었구나. 다른 사진을 시도해보게.',
      });
    }

    return res.status(500).json({
      error: '관상을 보는데 기가 막혔구나... 다시 시도해보게.',
    });
  }
}
