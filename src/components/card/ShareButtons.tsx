import React, { useState } from 'react';
import { CardData } from '../../types/card';
import {
  shareCardViaKakao,
  shareCardViaTwitter,
  shareCardViaNative,
  copyImageToClipboard,
} from '../../utils/share';
import { useShareTracking } from '../../hooks/useAnalytics';
import { MessageCircle, Share2, Copy, CheckCircle } from 'lucide-react';

interface ShareButtonsProps {
  cardData: CardData;
  imageBlob: Blob | null;
  imageUrl: string | null;
}

/**
 * 결과 카드 공유 버튼 그리드
 */
const ShareButtons: React.FC<ShareButtonsProps> = ({ cardData, imageBlob, imageUrl }) => {
  const [copied, setCopied] = useState(false);
  const trackShare = useShareTracking();

  /**
   * 카카오톡 공유
   */
  const handleKakaoShare = () => {
    if (!imageUrl) {
      return;
    }
    trackShare('kakao', cardData.mode);
    shareCardViaKakao(imageUrl, cardData.userName, cardData.headline);
  };

  /**
   * Twitter 공유
   */
  const handleTwitterShare = () => {
    trackShare('twitter', cardData.mode);
    shareCardViaTwitter(cardData.userName, cardData.headline);
  };

  /**
   * 네이티브 공유 (모바일)
   */
  const handleNativeShare = async () => {
    if (!imageBlob) {
      return;
    }

    trackShare('native', cardData.mode);
    const success = await shareCardViaNative(imageBlob, cardData.userName, cardData.headline);

    // Web Share API 지원 안 하는 경우 카카오톡으로 폴백
    if (!success && imageUrl) {
      handleKakaoShare();
    }
  };

  /**
   * 이미지 복사
   */
  const handleCopy = async () => {
    if (!imageBlob) {
      return;
    }

    trackShare('copy', cardData.mode);
    await copyImageToClipboard(imageBlob);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDisabled = !imageBlob || !imageUrl;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 카카오톡 */}
      <button
        onClick={handleKakaoShare}
        disabled={isDisabled}
        className="flex flex-col items-center gap-2 px-4 py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm">카카오톡</span>
      </button>

      {/* Twitter */}
      <button
        onClick={handleTwitterShare}
        disabled={isDisabled}
        className="flex flex-col items-center gap-2 px-4 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-sm">Twitter</span>
      </button>

      {/* 공유하기 (네이티브) */}
      <button
        onClick={handleNativeShare}
        disabled={isDisabled}
        className="flex flex-col items-center gap-2 px-4 py-3 bg-aurora-500/20 hover:bg-aurora-500/30 text-aurora-200 border border-aurora-500/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Share2 className="w-5 h-5" />
        <span className="text-sm">공유하기</span>
      </button>

      {/* 이미지 복사 */}
      <button
        onClick={handleCopy}
        disabled={isDisabled}
        className="flex flex-col items-center gap-2 px-4 py-3 bg-nebula-500/20 hover:bg-nebula-500/30 text-nebula-200 border border-nebula-500/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {copied ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-400">복사됨!</span>
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            <span className="text-sm">이미지 복사</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ShareButtons;
