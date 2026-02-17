// 완료된 분석 카드 컴포넌트 (Phase 2I-2)
import { CheckCircle } from 'lucide-react';
import { AnalysisResult, MODE_NAMES } from '../../types/chart';

interface CompletedAnalysisCardProps {
  analysis: AnalysisResult;
  onClick?: () => void;
}

export default function CompletedAnalysisCard({ analysis, onClick }: CompletedAnalysisCardProps) {
  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div
      className="glass-panel p-5 border-2 border-nebula-400/30 hover:border-nebula-400/50 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-nebula-400" />
        <h3 className="font-bold text-nebula-200 text-lg">
          {MODE_NAMES[analysis.mode]}
        </h3>
      </div>

      {/* 요약 */}
      <p className="text-sm text-starlight-200/80 mb-3 line-clamp-2">
        {analysis.summary}
      </p>

      {/* 심도 게이지 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gold-300/70">상담 심도</span>
          <span className="text-xs text-gold-300 font-medium">
            {analysis.depthScore}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-cosmic-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-nebula-400 to-nebula-500 transition-all"
            style={{ width: `${analysis.depthScore}%` }}
          />
        </div>
      </div>

      {/* 푸터 */}
      <div className="flex items-center justify-between pt-2 border-t border-cosmic-700">
        <span className="text-xs text-gold-300/60">
          {formatDate(analysis.completedAt)}
        </span>
        <button className="text-xs text-nebula-400 hover:text-gold-300 transition-colors group-hover:translate-x-1 duration-300">
          자세히 보기 →
        </button>
      </div>
    </div>
  );
}
