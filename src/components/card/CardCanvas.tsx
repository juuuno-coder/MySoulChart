import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { CardData } from '../../types/card';
import ResultCard from './ResultCard';
import ShareButtons from './ShareButtons';
import { Download, Loader2 } from 'lucide-react';

interface CardCanvasProps {
  cardData: CardData;
  onImageGenerated?: (blob: Blob, dataUrl: string) => void;
}

/**
 * ResultCard를 PNG로 변환하는 컴포넌트
 */
const CardCanvas: React.FC<CardCanvasProps> = ({ cardData, onImageGenerated }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  /**
   * 카드를 PNG로 변환
   */
  const generateImage = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!cardRef.current) return null;

    setIsGenerating(true);

    try {
      // html2canvas로 캡처
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // 고해상도
        backgroundColor: null, // 투명 배경
        logging: false,
        useCORS: true,
      });

      // Blob 및 DataURL 생성
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          const dataUrl = canvas.toDataURL('image/png');
          setGeneratedImage(dataUrl);
          setImageBlob(blob);

          if (onImageGenerated) {
            onImageGenerated(blob, dataUrl);
          }

          resolve({ blob, dataUrl });
        }, 'image/png');
      });
    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 컴포넌트 마운트 시 자동으로 이미지 생성
   */
  useEffect(() => {
    // 약간의 딜레이 후 생성 (렌더링 완료 대기)
    const timer = setTimeout(() => {
      generateImage();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /**
   * 이미지 다운로드
   */
  const handleDownload = async () => {
    if (!generatedImage) {
      await generateImage();
    }

    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `mysoulchart_${cardData.userName}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 카드 렌더링 (숨김 영역) */}
      <div ref={cardRef} className="inline-block">
        <ResultCard cardData={cardData} />
      </div>

      {/* 로딩 상태 */}
      {isGenerating && (
        <div className="flex items-center justify-center gap-2 text-nebula-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>카드 이미지를 생성하는 중...</span>
        </div>
      )}

      {/* 미리보기 (생성된 이미지) */}
      {generatedImage && !isGenerating && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-3">결과 카드</p>
            <img
              src={generatedImage}
              alt="Generated Card"
              className="inline-block w-[400px] h-[600px] rounded-2xl border border-cosmic-700 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
            />
          </div>

          {/* 다운로드 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-nebula-500/20 hover:bg-nebula-500/30 text-nebula-200 rounded-lg font-medium transition-colors border border-nebula-500/30"
            >
              <Download className="w-5 h-5" />
              이미지 다운로드
            </button>
          </div>

          {/* 공유 버튼 */}
          <div className="pt-2">
            <p className="text-sm text-gray-400 mb-3 text-center">공유하기</p>
            <ShareButtons
              cardData={cardData}
              imageBlob={imageBlob}
              imageUrl={generatedImage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CardCanvas;
