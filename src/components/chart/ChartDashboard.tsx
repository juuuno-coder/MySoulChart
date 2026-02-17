// 차트 대시보드 메인 컴포넌트 (Phase 2I-2)
import { UserChart, MODE_NAMES } from '../../types/chart';
import { AnalysisMode } from '../../types';
import CompletedAnalysisCard from './CompletedAnalysisCard';
import MissingAnalysisCard from './MissingAnalysisCard';
import ProgressBar from './ProgressBar';
import SharePermissionButton from './SharePermissionButton';
import { Sparkles } from 'lucide-react';

interface ChartDashboardProps {
  chart: UserChart;
  onStartAnalysis: (mode: AnalysisMode) => void;
  readOnly?: boolean; // 권한으로 타인 차트 볼 때 true
}

export default function ChartDashboard({ chart, onStartAnalysis, readOnly = false }: ChartDashboardProps) {
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
                    // TODO: 상세 모달 표시
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

        {/* 완성 축하 메시지 + 공유 버튼 */}
        {chart.completedCount === chart.totalAnalyses && !readOnly && (
          <div className="mt-8 text-center p-8 glass-panel border-2 border-nebula-400/50 rounded-2xl">
            <Sparkles className="w-12 h-12 text-nebula-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-nebula-200 mb-2">
              영혼 차트 완성을 축하합니다!
            </h2>
            <p className="text-starlight-200/70 mb-6">
              모든 분석을 완료하셨습니다. 이제 친구에게 차트를 선물해보세요.
            </p>
            <SharePermissionButton chart={chart} />
          </div>
        )}
      </div>
    </div>
  );
}
