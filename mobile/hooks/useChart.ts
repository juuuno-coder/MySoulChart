/**
 * 모바일용 차트 관리 훅
 * - AsyncStorage 로컬 저장 (기본)
 * - Firebase Auth 로그인 시 Firestore와 동기화
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../shared/services/firebase';
import { UserChart, AnalysisResult, SoulChartData, MODE_NAMES } from '../shared/types/chart';
import { AnalysisMode, UserProfile } from '../shared/types';
import { CardData } from '../shared/types/card';
import { generateSoulChart } from '../shared/services/api';
import { Alert } from 'react-native';

const CHART_STORAGE_KEY = '@mysoulchart/userChart';

export function useChart() {
  const [chart, setChart] = useState<UserChart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSoulChart, setIsGeneratingSoulChart] = useState(false);

  // 차트 불러오기 (AsyncStorage 우선, 로그인 시 Firestore)
  const loadChart = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. 로컬에서 먼저 로드
      const localData = await AsyncStorage.getItem(CHART_STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        setChart(parsed);
      }

      // 2. Firebase 로그인 상태면 Firestore에서 동기화
      const user = auth.currentUser;
      if (user) {
        const chartRef = doc(db, 'users', user.uid, 'userChart');
        const snapshot = await getDoc(chartRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const firestoreChart: UserChart = {
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
            completedAnalyses: Object.fromEntries(
              Object.entries(data.completedAnalyses || {}).map(([key, value]: [string, any]) => [
                key,
                {
                  ...value,
                  completedAt: value.completedAt?.toDate?.() || new Date(value.completedAt),
                },
              ])
            ),
          } as UserChart;

          setChart(firestoreChart);
          // 로컬에도 저장
          await AsyncStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(firestoreChart));
        } else if (!localData) {
          // Firestore에도 없고 로컬에도 없으면 새로 생성
          const newChart = createEmptyChart(user.uid, user.displayName || '도인');
          await setDoc(chartRef, newChart);
          setChart(newChart);
          await AsyncStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(newChart));
        }
      } else if (!localData) {
        // 비로그인 + 로컬 데이터 없으면 게스트 차트 생성
        const newChart = createEmptyChart('guest', '도인');
        setChart(newChart);
        await AsyncStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(newChart));
      }
    } catch (error) {
      console.error('차트 로드 에러:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 앱 시작 시 차트 로드
  useEffect(() => {
    loadChart();
  }, [loadChart]);

  // 분석 완료 저장
  const completeAnalysis = useCallback(
    async (mode: AnalysisMode, result: AnalysisResult) => {
      if (!chart) return;

      try {
        const updatedAnalyses = {
          ...chart.completedAnalyses,
          [mode]: result,
        };

        const completedCount = Object.keys(updatedAnalyses).length;
        const progressPercentage = (completedCount / 5) * 100;

        const updatedChart: UserChart = {
          ...chart,
          completedAnalyses: updatedAnalyses,
          completedCount,
          progressPercentage,
          updatedAt: new Date(),
        };

        // 로컬 저장
        setChart(updatedChart);
        await AsyncStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(updatedChart));

        // Firestore 동기화 (로그인 시)
        const user = auth.currentUser;
        if (user) {
          const chartRef = doc(db, 'users', user.uid, 'userChart');
          await updateDoc(chartRef, {
            [`completedAnalyses.${mode}`]: result,
            completedCount,
            progressPercentage,
            updatedAt: new Date(),
          });
        }

        Alert.alert('완료', `${MODE_NAMES[mode]} 분석이 완료되었습니다! (${completedCount}/5)`);

        if (completedCount === 5) {
          setTimeout(() => {
            Alert.alert('축하합니다!', '영혼 차트를 모두 완성하셨습니다!');
          }, 1000);
        }
      } catch (error) {
        console.error('분석 완료 저장 에러:', error);
        Alert.alert('오류', '분석 결과 저장에 실패했습니다');
      }
    },
    [chart]
  );

  // 종합 영혼 차트 생성
  const generateAndSaveSoulChart = useCallback(
    async (profile: Partial<UserProfile>) => {
      if (!chart || chart.completedCount < 5) return null;

      setIsGeneratingSoulChart(true);
      try {
        const analyses: Record<string, any> = {};
        for (const [mode, result] of Object.entries(chart.completedAnalyses)) {
          if (result) {
            analyses[mode] = (result as AnalysisResult).cardData;
          }
        }

        const soulChart = await generateSoulChart(profile, analyses);

        const updatedChart: UserChart = {
          ...chart,
          soulChart,
          updatedAt: new Date(),
        };

        // 로컬 저장
        setChart(updatedChart);
        await AsyncStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(updatedChart));

        // Firestore 동기화
        const user = auth.currentUser;
        if (user) {
          const chartRef = doc(db, 'users', user.uid, 'userChart');
          await updateDoc(chartRef, {
            soulChart,
            updatedAt: new Date(),
          });
        }

        Alert.alert('완성!', '종합 영혼 차트가 완성되었습니다!');
        return soulChart;
      } catch (error) {
        console.error('종합 차트 생성 에러:', error);
        Alert.alert('오류', '종합 차트 생성에 실패했습니다');
        return null;
      } finally {
        setIsGeneratingSoulChart(false);
      }
    },
    [chart]
  );

  const isAnalysisCompleted = useCallback(
    (mode: AnalysisMode): boolean => {
      return !!chart?.completedAnalyses[mode as keyof typeof chart.completedAnalyses];
    },
    [chart]
  );

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

function createEmptyChart(uid: string, name: string): UserChart {
  return {
    uid,
    name,
    completedAnalyses: {},
    progressPercentage: 0,
    totalAnalyses: 5,
    completedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
