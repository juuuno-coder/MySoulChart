import { AnalysisMode, UserProfile } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * 모드별로 프로필 데이터를 검증합니다.
 */
export function validateProfile(
  mode: AnalysisMode,
  profile: Partial<UserProfile>
): ValidationResult {
  const errors: Record<string, string> = {};

  // 공통 필수 필드: 이름은 모든 모드에서 필수
  if (!profile.name?.trim()) {
    errors.name = '이름을 입력해주세요';
  }

  // 모드별 필수 필드
  switch (mode) {
    case 'face':
      if (!profile.faceImage && !profile.faceFeatures) {
        errors.faceImage = '얼굴 사진을 업로드해주세요';
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
      break;

    case 'mbti':
      if (!profile.mbti) {
        errors.mbti = 'MBTI를 입력해주세요';
      }
      break;

    case 'blood':
      if (!profile.bloodType) {
        errors.bloodType = '혈액형을 선택해주세요';
      }
      break;

    case 'couple':
      if (!profile.birthDate) {
        errors.birthDate = '본인 생년월일을 입력해주세요';
      }
      if (!profile.partner?.name?.trim()) {
        errors.partnerName = '상대방 이름을 입력해주세요';
      }
      if (!profile.partner?.birthDate) {
        errors.partnerBirthDate = '상대방 생년월일을 입력해주세요';
      }
      break;

    case 'unified':
      if (!profile.birthDate) {
        errors.birthDate = '생년월일을 입력해주세요';
      }
      if (!profile.bloodType) {
        errors.bloodType = '혈액형을 선택해주세요';
      }
      if (!profile.mbti) {
        errors.mbti = 'MBTI를 입력해주세요';
      }
      break;

    case 'integrated':
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
