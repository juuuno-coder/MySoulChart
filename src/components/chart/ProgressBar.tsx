// 진행률 표시 컴포넌트 (Phase 2I-2)
interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="mt-4 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gold-300">
          영혼 차트 완성도
        </span>
        <span className="text-sm font-bold text-gold-200">
          {current} / {total}
        </span>
      </div>

      <div className="relative w-full h-3 bg-void-800 rounded-full overflow-hidden border border-void-700">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-gold-400/50 to-gold-300/50 blur-sm transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs text-gold-400">
          {percentage}% 완성
        </span>
      </div>
    </div>
  );
}
