import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Firebase Admin 초기화 (싱글톤)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();

// 카카오 사용자 정보 타입
interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    email?: string;
  };
}

// 카카오 액세스 토큰으로 사용자 정보 가져오기
async function getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('카카오 사용자 정보 조회 실패');
  }

  return response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않은 메서드입니다' });
  }

  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: '액세스 토큰이 필요합니다' });
    }

    // 1. 카카오 API로 사용자 정보 조회
    const kakaoUser = await getKakaoUserInfo(accessToken);

    // 2. Firebase Custom Token 생성
    const uid = `kakao_${kakaoUser.id}`;
    const customToken = await auth.createCustomToken(uid, {
      provider: 'kakao',
      kakaoId: kakaoUser.id,
      nickname: kakaoUser.kakao_account?.profile?.nickname,
      profileImage: kakaoUser.kakao_account?.profile?.profile_image_url,
    });

    // 3. (선택) Firestore에 사용자 정보 저장/업데이트
    // TODO: Phase 3에서 Firestore 활용 시 추가

    return res.status(200).json({
      customToken,
      user: {
        uid,
        nickname: kakaoUser.kakao_account?.profile?.nickname,
        profileImage: kakaoUser.kakao_account?.profile?.profile_image_url,
        email: kakaoUser.kakao_account?.email,
      },
    });
  } catch (error) {
    console.error('카카오 인증 에러:', error);
    return res.status(500).json({
      error: '카카오 로그인 처리 중 오류가 발생했습니다',
    });
  }
}
