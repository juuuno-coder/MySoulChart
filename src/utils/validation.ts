import { AnalysisMode, UserProfile } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof UserProfile, string>>;
}

/**
 * 모드별로 프로필 데이터를 검증합니다.
 */
export function validateProfile(
  mode: AnalysisMode,
  profile: Partial<UserProfile>
): ValidationResult {
  const errors: Partial<Record<keyof UserProfile, string>> = {};

  // 공통 필수 필드 (MBTI, 혈액형 제외)
  if (mode !== 'mbti' && mode !== 'blood') {
    if (!profile.name?.trim()) {
      errors.name = '이름을 입력해주세요';
    }
  }

  // 모드별 필수 필드
  switch (mode) {
    case 'face':
      if (!profile.faceImage && !profile.faceFeatures) {
        errors.faceImage = '얼굴 사진을 업로드하거나 관상 특징을 입력해주세요';
      }
      if (!profile.birthDate) {
        errors.birthDate = '생년월일을 입력해주세요';
      }
      break;

    case 'saju':
      if (!profile.birthDate) {
        errors.birthDate = '생년월일을 입력해주세요';
      }
      if (!profile.calendarType) {
        errors.calendarType = '양력/음력을 선택해주세요';
      }
      break;

    case 'zodiac':
      if (!profile.birthDate) {
        errors.birthDate = '생년월일을 입력해주세요';
      }
      // 별자리는 생년월일만 필요 (출생 시간/장소는 선택사항)
      break;

    case 'mbti':
      if (!profile.mbti) {
        errors.mbti = 'MBTI를 선택해주세요';
      }
      break;

    case 'blood':
      if (!profile.bloodType) {
        errors.bloodType = '혈액형을 선택해주세요';
      }
      break;

    case 'couple':
      if (!profile.name?.trim()) {
        errors.name = '본인 이름을 입력해주세요';
      }
      if (!profile.birthDate) {
        errors.birthDate = '본인 생년월일을 입력해주세요';
      }
      if (!profile.partner?.name?.trim()) {
        errors.name = '상대방 이름을 입력해주세요';
      }
      if (!profile.partner?.birthDate) {
        errors.birthDate = '상대방 생년월일을 입력해주세요';
      }
      break;

    case 'integrated':
      // 통합 모드는 최소한의 정보만 요구
      if (!profile.name?.trim()) {
        errors.name = '이름을 입력해주세요';
      }
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
