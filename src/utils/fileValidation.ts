// 파일 업로드 검증 유틸리티

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 이미지 파일 검증
 * - 파일 크기: 최대 5MB
 * - 파일 타입: jpeg, png, webp만 허용
 */
export const validateImageFile = (file: File): ValidationResult => {
  // 1. 파일 크기 확인 (최대 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `이미지 크기가 ${sizeMB}MB입니다. 5MB 이하의 이미지만 업로드 가능합니다.`
    };
  }

  // 2. 파일 타입 확인 (MIME 타입)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '이미지 파일만 업로드 가능합니다. (JPG, PNG, WebP)'
    };
  }

  // 3. 파일 확장자 추가 확인 (MIME 스푸핑 방지)
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      valid: false,
      error: '지원되지 않는 파일 형식입니다. JPG, PNG, WebP 파일만 가능합니다.'
    };
  }

  // 모든 검증 통과
  return { valid: true };
};

/**
 * 이미지 압축 (선택 사항 - 향후 구현)
 * Canvas API를 사용하여 이미지를 압축합니다.
 */
export const compressImage = async (
  file: File,
  maxSizeMB: number = 2
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
          return;
        }

        // 최대 너비/높이 설정 (메가픽셀 제한)
        const maxWidth = 1920;
        const maxHeight = 1920;

        let width = img.width;
        let height = img.height;

        // 비율 유지하면서 리사이즈
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height / width) * maxWidth;
            width = maxWidth;
          } else {
            width = (width / height) * maxHeight;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Base64로 변환 (품질 조정 - 0.8 = 80%)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
};
