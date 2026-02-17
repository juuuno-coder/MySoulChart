// SNS 공유 유틸리티 (Phase 2J-2)
import { showToast } from './toast';

/**
 * 카카오톡으로 차트 공유 (권한 토큰 방식)
 */
export async function shareChartViaKakao(
  permissionId: string,
  ownerName: string
): Promise<void> {
  if (!window.Kakao?.isInitialized()) {
    showToast('error', '카카오 SDK가 초기화되지 않았습니다');
    return;
  }

  const shareUrl = `${window.location.origin}/view/${permissionId}`;

  try {
    window.Kakao.Link.sendDefault({
      objectType: 'feed',
      content: {
        title: `${ownerName}님의 영혼 차트`,
        description: '종합 운세 분석 결과를 확인해보세요! 관상, 별자리, MBTI, 사주, 혈액형 분석 완료',
        imageUrl: `${window.location.origin}/og-chart.png`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '차트 보기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });

    showToast('success', '카카오톡으로 공유했습니다!');
  } catch (error) {
    console.error('카카오톡 공유 에러:', error);
    showToast('error', '카카오톡 공유에 실패했습니다');
  }
}

/**
 * Web Share API (모바일 네이티브 공유)
 */
export async function shareViaWebAPI(
  title: string,
  text: string,
  url: string
): Promise<void> {
  if (!navigator.share) {
    showToast('warning', '이 브라우저는 공유 기능을 지원하지 않습니다');
    return;
  }

  try {
    await navigator.share({
      title,
      text,
      url,
    });
    showToast('success', '공유했습니다!');
  } catch (error: any) {
    // 사용자가 취소한 경우는 에러 표시 안 함
    if (error.name !== 'AbortError') {
      console.error('Web Share 에러:', error);
      showToast('error', '공유에 실패했습니다');
    }
  }
}

/**
 * 클립보드에 URL 복사
 */
export async function copyToClipboard(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    showToast('success', '링크가 복사되었습니다!');
  } catch (error) {
    console.error('클립보드 복사 에러:', error);
    showToast('error', '링크 복사에 실패했습니다');
  }
}

/**
 * Twitter/X 공유
 */
export function shareViaTwitter(text: string, url: string): void {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`;

  window.open(twitterUrl, '_blank', 'width=550,height=420');
}

// ===== Phase 2C-3: 결과 카드 이미지 공유 =====

/**
 * 카카오톡으로 결과 카드 이미지 공유
 */
export async function shareCardViaKakao(
  imageUrl: string,
  userName: string,
  headline: string
): Promise<void> {
  // Kakao SDK 초기화 확인
  if (!window.Kakao?.isInitialized()) {
    if (window.Kakao && import.meta.env.VITE_KAKAO_JS_KEY) {
      window.Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
    } else {
      showToast('error', '카카오톡 SDK가 초기화되지 않았습니다');
      return;
    }
  }

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${userName}님의 영혼 차트`,
        description: headline,
        imageUrl: imageUrl,
        link: {
          mobileWebUrl: window.location.origin,
          webUrl: window.location.origin,
        },
      },
      buttons: [
        {
          title: '내 차트 만들기',
          link: {
            mobileWebUrl: window.location.origin,
            webUrl: window.location.origin,
          },
        },
      ],
    });

    showToast('success', '카카오톡 공유 메시지를 전송했습니다');
  } catch (error) {
    console.error('Kakao share error:', error);
    showToast('error', '카카오톡 공유에 실패했습니다');
  }
}

/**
 * Twitter/X로 결과 카드 공유
 */
export function shareCardViaTwitter(userName: string, headline: string): void {
  const text = `${userName}님의 영혼 차트: ${headline}`;
  const url = window.location.origin;
  const hashtags = 'MySoulChart,영혼차트,운세';

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;

  window.open(twitterUrl, '_blank', 'width=550,height=420');
  showToast('success', 'Twitter 공유 창을 열었습니다');
}

/**
 * Web Share API로 카드 이미지 공유 (모바일 네이티브)
 */
export async function shareCardViaNative(
  imageBlob: Blob,
  userName: string,
  headline: string
): Promise<boolean> {
  // Web Share API 지원 확인
  if (!navigator.share) {
    return false;
  }

  try {
    const file = new File([imageBlob], `mysoulchart_${userName}.png`, {
      type: 'image/png',
    });

    // Files API 지원 확인
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      return false;
    }

    await navigator.share({
      title: 'My Soul Chart',
      text: `${userName}님의 영혼 차트: ${headline}`,
      files: [file],
    });

    showToast('success', '공유되었습니다');
    return true;
  } catch (error: any) {
    // 사용자가 취소한 경우
    if (error.name === 'AbortError') {
      return true;
    }

    console.error('Native share error:', error);
    return false;
  }
}

/**
 * 클립보드에 이미지 복사
 */
export async function copyImageToClipboard(imageBlob: Blob): Promise<void> {
  try {
    // Clipboard API 지원 확인
    if (!navigator.clipboard || !navigator.clipboard.write) {
      showToast('warning', '이 브라우저에서는 클립보드 복사를 지원하지 않습니다');
      return;
    }

    const clipboardItem = new ClipboardItem({
      'image/png': imageBlob,
    });

    await navigator.clipboard.write([clipboardItem]);
    showToast('success', '이미지가 클립보드에 복사되었습니다');
  } catch (error) {
    console.error('Clipboard copy error:', error);
    showToast('error', '클립보드 복사에 실패했습니다');
  }
}

/**
 * Kakao SDK 타입 선언
 */
declare global {
  interface Window {
    Kakao: any;
  }
}
