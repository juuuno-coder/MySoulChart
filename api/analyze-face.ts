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

    // Gemini Vision API 호출
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

    const features = JSON.parse(jsonMatch[0]);

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
