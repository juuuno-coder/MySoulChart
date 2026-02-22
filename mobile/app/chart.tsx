import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadarChart from '../components/chart/RadarChart';
import { SoulChartData } from '../shared/types/chart';

export default function ChartScreen() {
  const params = useLocalSearchParams<{ chartData: string }>();
  const router = useRouter();

  const chartData: SoulChartData | null = (() => {
    if (!params.chartData) return null;
    try { return JSON.parse(params.chartData); } catch { return null; }
  })();

  if (!chartData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔮</Text>
        <Text style={styles.emptyTitle}>아직 영혼 차트가 없습니다</Text>
        <Text style={styles.emptySubtitle}>통합 상담 또는 5개 분석을 완료하면{'\n'}영혼 차트가 생성됩니다.</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => router.replace('/')}>
          <Text style={styles.startBtnText}>상담 시작하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `✦ My Soul Chart\n\n영혼 유형: ${chartData.soulType}\n${chartData.soulDescription}\n\n핵심 특성: ${chartData.coreTraits.join(', ')}\n\n💡 ${chartData.lifeAdvice}\n\n🔮 https://my-soul-chart.vercel.app`,
      });
    } catch {}
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Soul Chart' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* 영혼 유형 */}
          <View style={styles.soulTypeSection}>
            <Text style={styles.soulTypeLabel}>영혼 유형</Text>
            <Text style={styles.soulType}>{chartData.soulType}</Text>
            <Text style={styles.soulDescription}>{chartData.soulDescription}</Text>
          </View>

          {/* 레이더 차트 */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>영혼 차원 분석</Text>
            <RadarChart dimensions={chartData.dimensions} />
          </View>

          {/* 핵심 특성 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>핵심 특성</Text>
            <View style={styles.traits}>
              {chartData.coreTraits.map((trait, i) => (
                <View key={i} style={styles.traitChip}>
                  <Text style={styles.traitChipText}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 숨겨진 욕구 */}
          {chartData.hiddenDesire && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>숨겨진 욕구</Text>
              <View style={styles.desireBox}>
                <Text style={styles.desireIcon}>🌙</Text>
                <Text style={styles.desireText}>{chartData.hiddenDesire}</Text>
              </View>
            </View>
          )}

          {/* 인생 조언 */}
          {chartData.lifeAdvice && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>도사의 인생 조언</Text>
              <View style={styles.adviceBox}>
                <Text style={styles.adviceText}>{chartData.lifeAdvice}</Text>
              </View>
            </View>
          )}

          {/* 행운 요소 */}
          {chartData.luckyElements && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>행운의 요소</Text>
              <View style={styles.luckyGrid}>
                <LuckyItem icon="🎨" label="색상" value={chartData.luckyElements.color} />
                <LuckyItem icon="🔢" label="숫자" value={String(chartData.luckyElements.number)} />
                <LuckyItem icon="🧭" label="방향" value={chartData.luckyElements.direction} />
                <LuckyItem icon="🌸" label="계절" value={chartData.luckyElements.season} />
                <LuckyItem icon="☯️" label="오행" value={chartData.luckyElements.element} />
              </View>
            </View>
          )}

          {/* 액션 */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>차트 공유하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
              <Text style={styles.homeBtnText}>홈으로</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function LuckyItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.luckyItem}>
      <Text style={styles.luckyIcon}>{icon}</Text>
      <Text style={styles.luckyLabel}>{label}</Text>
      <Text style={styles.luckyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  content: { padding: 20, paddingBottom: 40 },
  // Empty state
  emptyContainer: {
    flex: 1, backgroundColor: '#0a0a1a', alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#e8eaff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9da3ff80', textAlign: 'center', lineHeight: 22 },
  startBtn: {
    marginTop: 24, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#9333ea',
  },
  startBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  // Soul Type
  soulTypeSection: {
    alignItems: 'center', marginBottom: 32, paddingVertical: 24,
    backgroundColor: '#12122e', borderRadius: 20, borderWidth: 1, borderColor: '#9333ea30',
  },
  soulTypeLabel: { fontSize: 13, color: '#9da3ff', fontWeight: '600', marginBottom: 8 },
  soulType: { fontSize: 28, fontWeight: 'bold', color: '#c084fc', marginBottom: 12 },
  soulDescription: { fontSize: 14, color: '#c8ccff', lineHeight: 22, textAlign: 'center', paddingHorizontal: 20 },
  // Chart
  chartSection: {
    backgroundColor: '#12122e', borderRadius: 16, padding: 20, marginBottom: 20,
    alignItems: 'center',
  },
  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#9da3ff', marginBottom: 14 },
  // Traits
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  traitChip: {
    backgroundColor: '#9333ea15', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#9333ea30',
  },
  traitChipText: { fontSize: 13, color: '#c084fc', fontWeight: '500' },
  // Desire
  desireBox: {
    flexDirection: 'row', backgroundColor: '#12122e', borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 12,
  },
  desireIcon: { fontSize: 24 },
  desireText: { flex: 1, fontSize: 14, color: '#c8ccff', lineHeight: 22 },
  // Advice
  adviceBox: {
    backgroundColor: '#12122e', borderRadius: 14, padding: 16,
    borderLeftWidth: 3, borderLeftColor: '#fbbf24',
  },
  adviceText: { fontSize: 14, color: '#c8ccff', lineHeight: 24 },
  // Lucky
  luckyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  luckyItem: {
    width: '30%', backgroundColor: '#12122e', borderRadius: 12, padding: 14,
    alignItems: 'center', gap: 4,
  },
  luckyIcon: { fontSize: 22 },
  luckyLabel: { fontSize: 11, color: '#9da3ff80' },
  luckyValue: { fontSize: 14, fontWeight: '600', color: '#e8eaff' },
  // Actions
  actions: { gap: 12, marginTop: 12 },
  shareBtn: { padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#9333ea' },
  shareBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  homeBtn: {
    padding: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#1a1a42', borderWidth: 1, borderColor: '#222256',
  },
  homeBtnText: { fontSize: 16, fontWeight: '500', color: '#9da3ff' },
});
