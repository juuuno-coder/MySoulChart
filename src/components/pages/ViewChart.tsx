// 권한으로 차트 보기 페이지 (Phase 2J-3)
import { useState, useEffect } from 'react';
import { UserChart } from '../../types/chart';
import { auth } from '../../services/firebase';
import { showToast } from '../../utils/toast';
import ChartDashboard from '../chart/ChartDashboard';
import { Loader2, Lock, AlertCircle } from 'lucide-react';

interface ViewChartProps {
  permissionId: string;
}

export default function ViewChart({ permissionId }: ViewChartProps) {
  const [chart, setChart] = useState<UserChart | null>(null);
  const [remainingViews, setRemainingViews] = useState(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChart();
  }, [permissionId]);

  const loadChart = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('로그인이 필요합니다');
      showToast('warning', '로그인 후 차트를 볼 수 있습니다');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/verify-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionId,
          viewerId: user.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '차트를 불러올 수 없습니다');
        showToast('error', data.error);
        setIsLoading(false);
        return;
      }

      // Firestore Timestamp → Date 변환
      const chartData = {
        ...data.chart,
        createdAt: new Date(data.chart.createdAt._seconds * 1000),
        updatedAt: new Date(data.chart.updatedAt._seconds * 1000),
        completedAnalyses: Object.fromEntries(
          Object.entries(data.chart.completedAnalyses || {}).map(([key, value]: [string, any]) => [
            key,
            {
              ...value,
              completedAt: new Date(value.completedAt._seconds * 1000),
            },
          ])
        ),
      };

      setChart(chartData);
      setRemainingViews(data.remainingViews);
      setExpiresAt(new Date(data.expiresAt));
      showToast('success', '차트를 불러왔습니다!');
    } catch (error) {
      console.error('차트 로드 에러:', error);
      setError('차트를 불러오는데 실패했습니다');
      showToast('error', '차트를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cosmic-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-nebula-400 animate-spin mx-auto mb-4" />
          <p className="text-nebula-200">차트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-cosmic-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-panel p-8 text-center border border-cosmic-700">
          <AlertCircle className="w-16 h-16 text-nebula-500/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-nebula-200 mb-2">
            차트를 볼 수 없습니다
          </h2>
          <p className="text-starlight-200/70 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-nebula-500/20 hover:bg-nebula-500/30 text-gold-300 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 차트 표시
  if (!chart) return null;

  return (
    <div className="min-h-screen bg-cosmic-950">
      {/* 권한 정보 헤더 */}
      <div className="bg-cosmic-900/80 border-b border-cosmic-700 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-nebula-400" />
            <div>
              <p className="text-sm text-nebula-200">
                선물 받은 차트 ({chart.name}님)
              </p>
              <p className="text-xs text-gold-300/60">
                남은 조회 횟수: {remainingViews}회
                {expiresAt && ` · 만료일: ${expiresAt.toLocaleDateString('ko-KR')}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 대시보드 (읽기 전용) */}
      <ChartDashboard
        chart={chart}
        onStartAnalysis={() => {
          showToast('warning', '선물 받은 차트는 조회만 가능합니다');
        }}
        readOnly={true}
      />
    </div>
  );
}
