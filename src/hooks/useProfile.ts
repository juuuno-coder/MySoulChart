import { useState, useCallback } from 'react';
import { UserProfile, AnalysisMode, PersonData } from '../types';

interface UseProfileReturn {
  profile: UserProfile;
  mode: AnalysisMode;
  setProfile: (profile: UserProfile) => void;
  setMode: (mode: AnalysisMode) => void;
  updateMainProfile: (updates: Partial<UserProfile>) => void;
  updatePartnerProfile: (updates: Partial<PersonData>) => void;
}

const INITIAL_PROFILE: UserProfile = {
  name: '',
  birthDate: '',
  calendarType: 'solar',
  birthTime: '',
  birthPlace: '',
  bloodType: '',
  mbti: '',
  gender: 'other',
  residence: '',
  faceImage: '',
  faceFeatures: '',
  partner: {
    name: '',
    birthDate: '',
    calendarType: 'solar',
    birthTime: '',
    birthPlace: '',
    bloodType: '',
    mbti: '',
    gender: 'other'
  }
};

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [mode, setMode] = useState<AnalysisMode>('integrated');

  /**
   * 본인 프로필 부분 업데이트
   */
  const updateMainProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 파트너 프로필 부분 업데이트
   */
  const updatePartnerProfile = useCallback((updates: Partial<PersonData>) => {
    setProfile(prev => ({
      ...prev,
      partner: prev.partner ? { ...prev.partner, ...updates } : { ...INITIAL_PROFILE.partner!, ...updates }
    }));
  }, []);

  return {
    profile,
    mode,
    setProfile,
    setMode,
    updateMainProfile,
    updatePartnerProfile,
  };
};
