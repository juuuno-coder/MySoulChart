/**
 * My Soul Chart - Mobile Storage (AsyncStorage)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const PROFILE_KEY = 'vibeProfile';
const SESSION_PREFIX = 'vibeSession_';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24시간

/**
 * 프로필 저장
 */
export async function saveProfile(profile: Partial<UserProfile>): Promise<void> {
  try {
    // faceImage는 저장하지 않음 (용량/보안)
    const { faceImage, ...safeProfile } = profile as any;
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(safeProfile));
  } catch (error) {
    console.error('프로필 저장 실패:', error);
  }
}

/**
 * 프로필 불러오기
 */
export async function loadProfile(): Promise<Partial<UserProfile> | null> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('프로필 불러오기 실패:', error);
    return null;
  }
}

/**
 * 세션 저장
 */
export async function saveSession(sessionId: string, data: any): Promise<void> {
  try {
    const sessionData = {
      ...data,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(sessionData));
  } catch (error) {
    console.error('세션 저장 실패:', error);
  }
}

/**
 * 세션 불러오기
 */
export async function loadSession(sessionId: string): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
    if (!data) return null;

    const session = JSON.parse(data);
    if (Date.now() - session.savedAt > SESSION_EXPIRY) {
      await AsyncStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
      return null;
    }

    return session;
  } catch (error) {
    console.error('세션 불러오기 실패:', error);
    return null;
  }
}

/**
 * 세션 삭제
 */
export async function clearSession(sessionId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
  } catch (error) {
    console.error('세션 삭제 실패:', error);
  }
}
