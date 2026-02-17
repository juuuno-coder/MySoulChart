import React from 'react';
import { CardData } from '../../types/card';
import { ZODIAC_DATA } from '../../constants/zodiac';
import { Sparkles, Star, Heart, Compass } from 'lucide-react';

interface ResultCardProps {
  cardData: CardData;
  className?: string;
}

/**
 * 결과 카드 컴포넌트 (400x600px)
 * glassmorphism + gold 테마
 */
const ResultCard: React.FC<ResultCardProps> = ({ cardData, className = '' }) => {
  const zodiacInfo = cardData.zodiacSign ? ZODIAC_DATA[cardData.zodiacSign] : null;

  return (
    <div
      className={`relative w-[400px] h-[600px] bg-gradient-to-br from-void-900/95 via-cosmic-900/95 to-void-950/95 backdrop-blur-xl rounded-2xl border border-nebula-500/30 shadow-[0_0_40px_rgba(212,175,55,0.3)] overflow-hidden ${className}`}
      id="result-card"
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(139,92,246,0.05),transparent_50%)]" />

      {/* 헤더 */}
      <div className="relative z-10 pt-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-nebula-400" />
          <h1 className="text-xl font-bold text-nebula-200 font-serif">
            My Soul Chart
          </h1>
          <Sparkles className="w-5 h-5 text-nebula-400" />
        </div>

        {/* 사용자 이름 */}
        <p className="text-sm text-gold-300/80 mb-2">{cardData.userName}님의 영혼 차트</p>

        {/* 별자리 (있을 경우) */}
        {zodiacInfo && (
          <div className="flex items-center justify-center gap-2 text-sm text-starlight-400/70">
            <span className="text-lg">{zodiacInfo.symbol}</span>
            <span>{zodiacInfo.name}</span>
            <span className="text-xs">({zodiacInfo.element})</span>
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 px-6 mt-6 space-y-5">
        {/* Headline */}
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-nebula-500/10 border border-nebula-500/30 rounded-lg">
            <p className="text-lg font-bold text-nebula-200 font-serif">
              {cardData.headline}
            </p>
          </div>
        </div>

        {/* 심도 게이지 */}
        <div className="bg-cosmic-900/50 rounded-lg p-3 border border-cosmic-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">영혼의 깊이</span>
            <span className="text-sm font-bold text-nebula-300">{cardData.depthScore}%</span>
          </div>
          <div className="w-full h-2 bg-cosmic-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-nebula-500 to-aurora-400 transition-all duration-1000"
              style={{ width: `${cardData.depthScore}%` }}
            />
          </div>
        </div>

        {/* 성격 특성 */}
        <div className="bg-cosmic-900/30 rounded-lg p-4 border border-cosmic-700/50">
          <h3 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Star className="w-3 h-3" />
            성격 특성
          </h3>
          <ul className="space-y-2">
            {cardData.traits.map((trait, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gold-200/90">
                <span className="text-nebula-400 mt-0.5">•</span>
                <span className="flex-1">{trait}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 핵심 조언 */}
        <div className="bg-gradient-to-br from-nebula-500/10 to-aurora-500/10 rounded-lg p-4 border border-nebula-500/20">
          <h3 className="text-xs font-medium text-nebula-300 mb-2 flex items-center gap-2">
            <Heart className="w-3 h-3" />
            핵심 조언
          </h3>
          <p className="text-sm text-gold-100/90 leading-relaxed font-serif">
            {cardData.advice}
          </p>
        </div>

        {/* 행운 아이템 */}
        <div className="bg-cosmic-900/30 rounded-lg p-3 border border-cosmic-700/50">
          <h3 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
            <Compass className="w-3 h-3" />
            행운의 기운
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">색</p>
              <p className="text-xs font-medium text-gold-300">{cardData.luckyItems.color}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">숫자</p>
              <p className="text-xs font-medium text-gold-300">{cardData.luckyItems.number}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">방향</p>
              <p className="text-xs font-medium text-gold-300">{cardData.luckyItems.direction}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 워터마크 */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[10px] text-gray-600">
          mysoulchart.vercel.app
        </p>
      </div>
    </div>
  );
};

export default ResultCard;
