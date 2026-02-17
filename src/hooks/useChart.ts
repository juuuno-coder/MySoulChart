// 종합 차트 관리 훅 (Phase 2I-3)
import { useState, useCallback, useEffect } from 'react';
import { UserChart, AnalysisResult, SoulChartData, MODE_NAMES } from '../types/chart';
import { AnalysisMode, UserProfile } from '../types';
import { auth } from '../services/firebase';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { showToast } from '../utils/toast';
import { generateSoulChart } from '../services/api';

export function useChart() {
  const [chart, setChart] = useState<UserChart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 차트 불러오기
  const loadChart = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setChart(null);
      return;
    }

    setIsLoading(true);
    try {
      const chartRef = doc(db, 'users', user.uid, 'userChart');
      const snapshot = await getDoc(chartRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        // Firestore Timestamp → Date 변환
        setChart({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          completedAnalyses: Object.fromEntries(
            Object.entries(data.completedAnalyses || {}).map(([key, value]: [string, any]) => [
              key,
              {
                ...value,
                completedAt: value.completedAt?.toDate() || new Date(),
              },
            ])
          ),
        } as UserChart);
      } else {
        // 신규 차트 생성
        const newChart: UserChart = {
          uid: user.uid,
          name: user.displayName || '도인',
          profileImage: user.photoURL || undefined,
          completedAnalyses: {},
          progressPercentage: 0,
          totalAnalyses: 5,
          completedCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(chartRef, newChart);
        setChart(newChart);
        showToast('success', '영혼 차트가 생성되었습니다!');
      }
    } catch (error) {
      console.error('차트 로드 에러:', error);
      showToast('error', '차트를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 분석 완료 저장
  const completeAnalysis = useCallback(
    async (mode: AnalysisMode, result: AnalysisResult) => {
      const user = auth.currentUser;
      if (!user || !chart) {
        showToast('warning', '로그인이 필요합니다');
        return;
      }

      try {
        const chartRef = doc(db, 'users', user.uid, 'userChart');

        const updatedAnalyses = {
          ...chart.completedAnalyses,
          [mode]: result,
        };

        const completedCount = Object.keys(updatedAnalyses).length;
        const progressPercentage = (completedCount / 5) * 100;

        // Firestore 업데이트
        await updateDoc(chartRef, {
          [`completedAnalyses.${mode}`]: result,
          completedCount,
          progressPercentage,
          updatedAt: new Date(),
        });

        // 로컬 상태 업데이트
        setChart({
          ...chart,
          completedAnalyses: updatedAnalyses,
          completedCount,
          progressPercentage,
          updatedAt: new Date(),
        });

        // 완료 토스트
        showToast(
          'success',
          `${MODE_NAMES[mode]} 분석이 완료되었습니다! (${completedCount}/5)`
        );

        // 전체 완성 시 축하 메시지
        if (completedCount === 5) {
          setTimeout(() => {
            showToast('success', '🎉 영혼 차트를 모두 완성하셨습니다!');
          }, 1000);
        }
      } catch (error) {
        console.error('분석 완료 저장 에러:', error);
        showToast('error', '분석 결과 저장에 실패했습니다');
      }
    },
    [chart]
  );

  // 종합 영혼 차트 생성
  const [isGeneratingSoulChart, setIsGeneratingSoulChart] = useState(false);

  const generateAndSaveSoulChart = useCallback(
    async (profile: Partial<UserProfile>) => {
      const user = auth.currentUser;
      if (!user || !chart || chart.completedCount < 5) return null;

      setIsGeneratingSoulChart(true);
      try {
        // 개별 분석의 CardData를 모아서 API 호출
        const analyses: Record<string, any> = {};
        for (const [mode, result] of Object.entries(chart.completedAnalyses)) {
          if (result) {
            analyses[mode] = result.cardData;
          }
        }

        // couple 분석이 있으면 포함
        if (chart.couple) {
          analyses.couple = chart.couple.cardData;
        }

        const soulChart = await generateSoulChart(profile, analyses);

        // Firestore에 저장
        const chartRef = doc(db, 'users', user.uid, 'userChart');
        await updateDoc(chartRef, {
          soulChart,
          updatedAt: new Date(),
        });

        // 로컬 상태 업데이트
        setChart((prev) =>
          prev ? { ...prev, soulChart, updatedAt: new Date() } : prev
        );

        showToast('success', '종합 영혼 차트가 완성되었습니다!');
        return soulChart;
      } catch (error) {
        console.error('종합 차트 생성 에러:', error);
        showToast('error', '종합 차트 생성에 실패했습니다. 다시 시도해주세요.');
        return null;
      } finally {
        setIsGeneratingSoulChart(false);
      }
    },
    [chart]
  );

  // 분석 완료 여부 확인
  const isAnalysisCompleted = useCallback(
    (mode: AnalysisMode): boolean => {
      return !!chart?.completedAnalyses[mode];
    },
    [chart]
  );

  // 진행률 계산
  const getProgress = useCallback(() => {
    if (!chart) return { percentage: 0, count: 0, total: 5 };
    return {
      percentage: chart.progressPercentage,
      count: chart.completedCount,
      total: chart.totalAnalyses,
    };
  }, [chart]);

  return {
    chart,
    isLoading,
    isGeneratingSoulChart,
    loadChart,
    completeAnalysis,
    generateAndSaveSoulChart,
    isAnalysisCompleted,
    getProgress,
  };
}
