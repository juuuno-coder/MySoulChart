// 차트 대시보드 메인 컴포넌트 (Phase 2I-2)
import { useEffect, useRef } from 'react';
import { UserChart, SoulChartData, MODE_NAMES } from '../../types/chart';
import { AnalysisMode, UserProfile } from '../../types';
import CompletedAnalysisCard from './CompletedAnalysisCard';
import MissingAnalysisCard from './MissingAnalysisCard';
import ProgressBar from './ProgressBar';
import SoulChartView from './SoulChartView';
import { Sparkles, Loader2 } from 'lucide-react';

interface ChartDashboardProps {
  chart: UserChart;
  profile?: Partial<UserProfile>;
  onStartAnalysis: (mode: AnalysisMode) => void;
  onStartQnA?: () => void;
  readOnly?: boolean;
  isGeneratingSoulChart?: boolean;
  onGenerateSoulChart?: () => void;
}

export default function ChartDashboard({
  chart,
  profile,
  onStartAnalysis,
  onStartQnA,
  readOnly = false,
  isGeneratingSoulChart = false,
  onGenerateSoulChart,
}: ChartDashboardProps) {
  const generationTriggered = useRef(false);

  // 5개 완료 + 종합 차트 미생성 → 자동 생성 트리거
  useEffect(() => {
    if (
      chart.completedCount >= 5 &&
      !chart.soulChart &&
      !isGeneratingSoulChart &&
      !generationTriggered.current &&
      !readOnly &&
      onGenerateSoulChart
    ) {
      generationTriggered.current = true;
      onGenerateSoulChart();
    }
  }, [chart.completedCount, chart.soulChart, isGeneratingSoulChart, readOnly, onGenerateSoulChart]);

  // 종합 차트 생성 중 → 로딩 화면
  if (isGeneratingSoulChart) {
    return (
      <div className="min-h-screen bg-cosmic-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-nebula-400 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-nebula-200">
            종합 영혼 차트를 생성하고 있습니다...
          </h2>
          <p className="text-gray-400 text-sm">
            5가지 분석 결과를 종합하여 영혼의 전체 모습을 그리는 중
          </p>
        </div>
      </div>
    );
  }

  // 종합 차트 이미 있음 → SoulChartView 표시
  if (chart.soulChart) {
    return (
      <SoulChartView
        soulChart={chart.soulChart}
        userName={chart.name}
        onStartQnA={onStartQnA}
        onGoBack={undefined}
      />
    );
  }

  // 5가지 핵심 분석 모드 (couple, integrated 제외)
  const modes: AnalysisMode[] = ['face', 'zodiac', 'mbti', 'saju', 'blood'];

  return (
    <div className="min-h-screen bg-cosmic-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-nebula-400 animate-pulse-slow" />
            <h1 className="text-3xl md:text-4xl font-bold text-nebula-200">
              {chart.name}님의 영혼 차트
            </h1>
          </div>

          {readOnly && (
            <div className="inline-block px-4 py-2 bg-cosmic-700/50 border border-nebula-400 rounded-lg">
              <span className="text-sm text-nebula-100">
                선물 받은 차트입니다
              </span>
            </div>
          )}

          <ProgressBar
            current={chart.completedCount}
            total={chart.totalAnalyses}
          />

          <p className="text-gray-400 text-sm">
            5가지 분석을 완료하면 종합 영혼 차트가 생성됩니다
          </p>
        </div>

        {/* 분석 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modes.map((mode) => {
            const analysis = chart.completedAnalyses[mode];

            if (analysis) {
              return (
                <CompletedAnalysisCard
                  key={mode}
                  analysis={analysis}
                  onClick={() => {
                    console.log('Show detail:', mode);
                  }}
                />
              );
            } else {
              return (
                <MissingAnalysisCard
                  key={mode}
                  mode={mode}
                  onStart={() => {
                    if (!readOnly) {
                      onStartAnalysis(mode);
                    }
                  }}
                />
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
