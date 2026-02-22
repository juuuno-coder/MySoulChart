/**
 * 모바일 이미지 파일 검증
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Base64 이미지 데이터를 검증합니다.
 * - MIME 타입 확인 (JPEG, PNG, WebP)
 * - 파일 크기 확인 (5MB 이하)
 */
export function validateImageBase64(base64Data: string): ImageValidationResult {
  // data:image/jpeg;base64,... 형식에서 MIME 추출
  const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
  if (!mimeMatch) {
    return { isValid: false, error: '유효하지 않은 이미지 형식입니다.' };
  }

  const mimeType = mimeMatch[1];
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { isValid: false, error: 'JPEG, PNG, WebP 이미지만 지원됩니다.' };
  }

  // Base64 데이터 크기 계산 (Base64는 원본의 약 4/3 크기)
  const rawBase64 = base64Data.split(',')[1] || '';
  const estimatedBytes = Math.floor(rawBase64.length * 0.75);
  if (estimatedBytes > MAX_SIZE_BYTES) {
    return { isValid: false, error: `이미지 크기가 ${MAX_SIZE_MB}MB를 초과합니다.` };
  }

  return { isValid: true };
}
