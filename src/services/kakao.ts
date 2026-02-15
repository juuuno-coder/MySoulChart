import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

// Kakao SDK 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

// Kakao SDK 초기화
export function initKakaoSDK() {
  if (typeof window === 'undefined') return;

  // 이미 초기화되었으면 스킵
  if (window.Kakao?.isInitialized()) {
    return;
  }

  const kakaoJsKey = import.meta.env.VITE_KAKAO_JS_KEY;
  if (!kakaoJsKey) {
    console.error('VITE_KAKAO_JS_KEY가 설정되지 않았습니다');
    return;
  }

  // Kakao SDK 초기화
  window.Kakao?.init(kakaoJsKey);
  console.log('Kakao SDK 초기화 완료');
}

// 카카오 로그인
export async function loginWithKakao(): Promise<{
  uid: string;
  nickname?: string;
  profileImage?: string;
  email?: string;
}> {
  return new Promise((resolve, reject) => {
    if (!window.Kakao) {
      reject(new Error('Kakao SDK가 로드되지 않았습니다'));
      return;
    }

    window.Kakao.Auth.login({
      success: async (authObj: any) => {
        try {
          const accessToken = authObj.access_token;

          // Vercel 서버리스 함수로 액세스 토큰 전송
          const response = await fetch('/api/kakao-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessToken }),
          });

          if (!response.ok) {
            throw new Error('카카오 인증 실패');
          }

          const { customToken, user } = await response.json();

          // Firebase Custom Token으로 로그인
          await signInWithCustomToken(auth, customToken);

          resolve(user);
        } catch (error) {
          console.error('카카오 로그인 에러:', error);
          reject(error);
        }
      },
      fail: (err: any) => {
        console.error('카카오 로그인 실패:', err);
        reject(err);
      },
    });
  });
}

// 카카오 로그아웃
export async function logoutKakao() {
  if (!window.Kakao) {
    console.warn('Kakao SDK가 로드되지 않았습니다');
    return;
  }

  return new Promise((resolve, reject) => {
    window.Kakao.Auth.logout((response: any) => {
      if (response) {
        resolve(response);
      } else {
        reject(new Error('카카오 로그아웃 실패'));
      }
    });
  });
}

// 카카오 연결 끊기 (회원 탈퇴)
export async function unlinkKakao() {
  if (!window.Kakao) {
    console.warn('Kakao SDK가 로드되지 않았습니다');
    return;
  }

  return new Promise((resolve, reject) => {
    window.Kakao.API.request({
      url: '/v1/user/unlink',
      success: (response: any) => {
        resolve(response);
      },
      fail: (error: any) => {
        reject(error);
      },
    });
  });
}
