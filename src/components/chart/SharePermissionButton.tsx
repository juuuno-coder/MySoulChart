// 차트 공유 권한 선물 버튼 (Phase 2J-2)
import { useState } from 'react';
import { Gift, Link2, Share2, MessageCircle } from 'lucide-react';
import { UserChart } from '../../types/chart';
import { shareChartViaKakao, copyToClipboard, shareViaWebAPI } from '../../utils/share';
import { showToast } from '../../utils/toast';

interface SharePermissionButtonProps {
  chart: UserChart;
}

export default function SharePermissionButton({ chart }: SharePermissionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleCreatePermission = async () => {
    setIsLoading(true);
    try {
      // 1. 권한 토큰 생성
      const response = await fetch('/api/create-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: chart.uid,
          ownerName: chart.name,
        }),
      });

      if (!response.ok) {
        throw new Error('권한 생성 실패');
      }

      const { permissionId } = await response.json();

      // 2. 공유 메뉴 표시
      setShowShareMenu(true);

      // 3. 공유 URL 생성
      const shareUrl = `${window.location.origin}/view/${permissionId}`;

      // 임시로 permissionId 저장 (공유 메뉴에서 사용)
      (window as any).__tempPermissionId = permissionId;
      (window as any).__tempShareUrl = shareUrl;
    } catch (error) {
      console.error('권한 생성 에러:', error);
      showToast('error', '권한 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoShare = async () => {
    const permissionId = (window as any).__tempPermissionId;
    if (!permissionId) return;

    await shareChartViaKakao(permissionId, chart.name);
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    const shareUrl = (window as any).__tempShareUrl;
    if (!shareUrl) return;

    await copyToClipboard(shareUrl);
    setShowShareMenu(false);
  };

  const handleWebShare = async () => {
    const shareUrl = (window as any).__tempShareUrl;
    if (!shareUrl) return;

    await shareViaWebAPI(
      `${chart.name}님의 영혼 차트`,
      '종합 운세 분석 결과를 확인해보세요!',
      shareUrl
    );
    setShowShareMenu(false);
  };

  if (showShareMenu) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-nebula-200 text-center mb-4">
          차트를 공유할 방법을 선택하세요
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* 카카오톡 */}
          <button
            onClick={handleKakaoShare}
            className="flex items-center gap-2 px-4 py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] rounded-lg font-medium transition-colors justify-center"
          >
            <MessageCircle className="w-5 h-5" />
            카카오톡
          </button>

          {/* 링크 복사 */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-3 bg-cosmic-800 hover:bg-cosmic-700 text-nebula-200 rounded-lg font-medium transition-colors border border-cosmic-600 justify-center"
          >
            <Link2 className="w-5 h-5" />
            링크 복사
          </button>

          {/* Web Share (모바일) */}
          {navigator.share && (
            <button
              onClick={handleWebShare}
              className="flex items-center gap-2 px-4 py-3 bg-cosmic-800 hover:bg-cosmic-700 text-nebula-200 rounded-lg font-medium transition-colors border border-cosmic-600 justify-center col-span-2"
            >
              <Share2 className="w-5 h-5" />
              다른 앱으로 공유
            </button>
          )}
        </div>

        <button
          onClick={() => setShowShareMenu(false)}
          className="w-full py-2 text-sm text-gold-300 hover:text-nebula-200 transition-colors"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCreatePermission}
      disabled={isLoading || chart.completedCount < 5}
      className="flex items-center gap-2 px-6 py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Gift className="w-5 h-5" />
      {isLoading ? '준비 중...' : '친구에게 선물하기'}
    </button>
  );
}
