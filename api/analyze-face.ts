import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate Limiting (메모리 기반)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 분당 최대 5회 (이미지 분석은 더 비쌈)
const RATE_WINDOW = 60 * 1000;

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
      features: '지금 너무 많은 영혼이 찾아와서 기가 고갈되었구나... 잠시 쉬었다가 다시 와주게.',
    });
  }

  const { image } = req.body || {};

  // 입력 검증
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
  }

  // Base64 이미지 파싱
  const matches = image.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ error: '잘못된 이미지 형식입니다.' });
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // MIME 타입 검증
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return res.status(400).json({ error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP만 가능)' });
  }

  // 크기 검증 (Base64 → 바이트 변환, 약 5MB 제한)
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > 5 * 1024 * 1024) {
    return res.status(400).json({ error: '이미지 크기가 너무 큽니다. (최대 5MB)' });
  }

  // API 키 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({
      features: '영혼의 문이 잠겨있구나... 관리자에게 알려주게.',
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: '이 사람의 얼굴 관상을 아주 상세하게 분석해줘. 눈매, 코의 모양, 입술, 얼굴형, 전반적인 기운 등을 전문가처럼 묘사해줘. 성격이나 운세와 연결지을 수 있는 특징 위주로.',
      },
    ]);

    const response = await result.response;
    const features = response.text() || '관상 분석 결과를 불러올 수 없습니다.';

    // 이미지 데이터는 메모리에서 즉시 해제 (변수 참조 끊기)
    return res.status(200).json({ features });
  } catch (error: any) {
    console.error('Face Analysis Error:', error);
    const msg = error.message || '';

    if (msg.includes('429') || msg.includes('quota')) {
      return res.status(429).json({
        features: '지금 너무 많은 영혼이 찾아와서 기가 고갈되었구나...',
      });
    }

    return res.status(500).json({
      features: '관상을 보는데 실패했구나... 잠시 후 다시 시도해주게.',
    });
  }
}
