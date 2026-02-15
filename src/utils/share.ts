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
