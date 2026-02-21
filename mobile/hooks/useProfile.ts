/**
 * 프로필 저장/복원 훅
 * AsyncStorage에 프로필을 저장하여 재방문 시 자동 복원
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../shared/types';

const PROFILE_STORAGE_KEY = '@mysoulchart/userProfile';
const ONBOARDING_KEY = '@mysoulchart/onboardingCompleted';

export function useProfile() {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // 프로필 로드
  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, onboarding] = await Promise.all([
          AsyncStorage.getItem(PROFILE_STORAGE_KEY),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);

        if (profileData) {
          setProfile(JSON.parse(profileData));
        }
        setHasCompletedOnboarding(onboarding === 'true');
      } catch (error) {
        console.error('프로필 로드 에러:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // 프로필 저장
  const saveProfile = useCallback(async (newProfile: Partial<UserProfile>) => {
    try {
      // faceImage는 저장하지 않음 (용량/보안)
      const profileToSave = { ...newProfile };
      delete profileToSave.faceImage;

      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileToSave));
      setProfile(profileToSave);
    } catch (error) {
      console.error('프로필 저장 에러:', error);
    }
  }, []);

  // 프로필 초기화
  const clearProfile = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      setProfile(null);
    } catch (error) {
      console.error('프로필 삭제 에러:', error);
    }
  }, []);

  // 온보딩 완료 표시
  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('온보딩 저장 에러:', error);
    }
  }, []);

  return {
    profile,
    isLoading,
    hasCompletedOnboarding,
    saveProfile,
    clearProfile,
    completeOnboarding,
  };
}
