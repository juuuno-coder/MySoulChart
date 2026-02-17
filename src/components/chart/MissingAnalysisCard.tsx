// 미완료 분석 카드 컴포넌트 (Phase 2I-2)
import { Lock } from 'lucide-react';
import { AnalysisMode } from '../../types';
import { MODE_NAMES, MODE_DESCRIPTIONS } from '../../types/chart';

interface MissingAnalysisCardProps {
  mode: AnalysisMode;
  onStart: () => void;
}

export default function MissingAnalysisCard({ mode, onStart }: MissingAnalysisCardProps) {
  return (
    <div className="glass-panel p-5 border-2 border-cosmic-700 opacity-70 hover:opacity-100 hover:border-cosmic-600 transition-all duration-300 group">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-5 h-5 text-nebula-500/40 group-hover:text-nebula-500/60 transition-colors" />
        <h3 className="font-bold text-nebula-400/60 text-lg group-hover:text-nebula-400/80 transition-colors">
          {MODE_NAMES[mode]}
        </h3>
      </div>

      {/* 설명 */}
      <p className="text-sm text-starlight-200/40 mb-4 min-h-[40px]">
        {MODE_DESCRIPTIONS[mode]}
      </p>

      {/* 시작 버튼 */}
      <button
        onClick={onStart}
        className="w-full py-2.5 bg-nebula-500/15 hover:bg-nebula-500/25 text-gold-300 rounded-lg text-sm font-medium transition-all duration-300 border border-nebula-500/20 hover:border-nebula-500/40"
      >
        분석 시작하기
      </button>
    </div>
  );
}
