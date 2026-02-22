import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnalysisMode, UserProfile } from '../../shared/types';
import { CardData } from '../../shared/types/card';
import { generateCard } from '../../shared/services/api';

const MODE_NAMES: Record<string, string> = {
  face: '관상', zodiac: '별자리', mbti: 'MBTI',
  saju: '사주명리', blood: '혈액형', couple: '궁합',
  unified: '통합 상담',
};

const MODE_COLORS: Record<string, string> = {
  face: '#ec4899', zodiac: '#3b82f6', mbti: '#10b981',
  saju: '#f59e0b', blood: '#ef4444', couple: '#f472b6',
  unified: '#9333ea',
};

export default function CardScreen() {
  const params = useLocalSearchParams<{
    mode: string; profile: string; history: string; depth: string;
  }>();
  const router = useRouter();
  const mode = (params.mode || 'unified') as AnalysisMode;
  const profile: Partial<UserProfile> = (() => {
    if (!params.profile) return {};
    try { return JSON.parse(params.profile); } catch { return {}; }
  })();
  const history = (() => {
    if (!params.history) return [];
    try { return JSON.parse(params.history); } catch { return []; }
  })();
  const depthScore = parseInt(params.depth || '100', 10);

  const [card, setCard] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const cardData = await generateCard(mode, profile, history, depthScore);
        setCard(cardData);
      } catch (err: any) {
        setError(err.message || '카드 생성에 실패했습니다.');
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const handleShare = async () => {
    if (!card) return;
    try {
      await Share.share({
        message: `✦ My Soul Chart - ${MODE_NAMES[mode]} 분석\n\n"${card.headline}"\n\n${card.traits.map(t => `• ${t}`).join('\n')}\n\n💡 ${card.advice}\n\n🔮 https://my-soul-chart.vercel.app`,
      });
    } catch {}
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={styles.loadingText}>영혼 카드를 만드는 중...</Text>
      </View>
    );
  }

  if (error || !card) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || '카드를 불러올 수 없습니다.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = MODE_COLORS[mode] || '#9333ea';

  return (
    <>
      <Stack.Screen options={{ title: `${MODE_NAMES[mode]} 카드`, headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* 카드 */}
          <View style={[styles.card, { borderColor: color + '40' }]}>
            {/* 헤더 */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardMode}>{MODE_NAMES[mode]} 분석</Text>
              <View style={[styles.depthBadge, { backgroundColor: color }]}>
                <Text style={styles.depthText}>{depthScore}%</Text>
              </View>
            </View>

            {/* 이름 */}
            <Text style={styles.userName}>{card.userName || profile.name || '도인'}</Text>

            {/* 헤드라인 */}
            <Text style={[styles.headline, { color }]}>{card.headline}</Text>

            {/* 구분선 */}
            <View style={[styles.divider, { backgroundColor: color + '30' }]} />

            {/* 특성 */}
            <View style={styles.traitsSection}>
              <Text style={styles.sectionLabel}>핵심 특성</Text>
              {card.traits.map((trait, i) => (
                <View key={i} style={styles.traitRow}>
                  <View style={[styles.traitDot, { backgroundColor: color }]} />
                  <Text style={styles.traitText}>{trait}</Text>
                </View>
              ))}
            </View>

            {/* 조언 */}
            <View style={[styles.adviceBox, { borderColor: color + '30' }]}>
              <Text style={styles.adviceLabel}>💡 도사의 조언</Text>
              <Text style={styles.adviceText}>{card.advice}</Text>
            </View>

            {/* 행운 아이템 */}
            {card.luckyItems && (
              <View style={styles.luckySection}>
                <Text style={styles.sectionLabel}>행운의 요소</Text>
                <View style={styles.luckyRow}>
                  {card.luckyItems.color && (
                    <View style={styles.luckyItem}>
                      <Text style={styles.luckyIcon}>🎨</Text>
                      <Text style={styles.luckyValue}>{card.luckyItems.color}</Text>
                    </View>
                  )}
                  {card.luckyItems.number && (
                    <View style={styles.luckyItem}>
                      <Text style={styles.luckyIcon}>🔢</Text>
                      <Text style={styles.luckyValue}>{card.luckyItems.number}</Text>
                    </View>
                  )}
                  {card.luckyItems.direction && (
                    <View style={styles.luckyItem}>
                      <Text style={styles.luckyIcon}>🧭</Text>
                      <Text style={styles.luckyValue}>{card.luckyItems.direction}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 로고 */}
            <Text style={styles.logo}>✦ My Soul Chart</Text>
          </View>

          {/* 액션 버튼 */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: color }]} onPress={handleShare}>
              <Text style={styles.shareBtnText}>공유하기</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: {
    flex: 1, backgroundColor: '#0a0a1a', alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { color: '#9da3ff', marginTop: 16, fontSize: 15 },
  errorText: { color: '#ef4444', fontSize: 15, marginBottom: 16 },
  retryBtn: { padding: 12, borderRadius: 8, backgroundColor: '#1a1a42' },
  retryText: { color: '#e8eaff', fontSize: 14 },
  // Card
  card: {
    backgroundColor: '#12122e', borderRadius: 20, padding: 24,
    borderWidth: 1, marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  cardMode: { fontSize: 13, color: '#9da3ff', fontWeight: '600', textTransform: 'uppercase' },
  depthBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  depthText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 14, color: '#9da3ff80', marginBottom: 8 },
  headline: { fontSize: 22, fontWeight: 'bold', lineHeight: 32, marginBottom: 20 },
  divider: { height: 1, marginBottom: 20 },
  // Traits
  traitsSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, color: '#9da3ff', fontWeight: '600', marginBottom: 12 },
  traitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  traitDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  traitText: { fontSize: 14, color: '#c8ccff', lineHeight: 20 },
  // Advice
  adviceBox: {
    borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20,
    backgroundColor: '#0a0a1a40',
  },
  adviceLabel: { fontSize: 13, fontWeight: '600', color: '#fbbf24', marginBottom: 8 },
  adviceText: { fontSize: 14, color: '#c8ccff', lineHeight: 22 },
  // Lucky
  luckySection: { marginBottom: 20 },
  luckyRow: { flexDirection: 'row', gap: 12 },
  luckyItem: {
    flex: 1, backgroundColor: '#0a0a1a60', borderRadius: 10, padding: 12, alignItems: 'center',
  },
  luckyIcon: { fontSize: 20, marginBottom: 4 },
  luckyValue: { fontSize: 13, color: '#e8eaff', fontWeight: '500' },
  logo: { textAlign: 'center', fontSize: 12, color: '#9da3ff40', marginTop: 8 },
  // Actions
  actions: { gap: 12 },
  shareBtn: { padding: 16, borderRadius: 14, alignItems: 'center' },
  shareBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  homeBtn: {
    padding: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#1a1a42', borderWidth: 1, borderColor: '#222256',
  },
  homeBtnText: { fontSize: 16, fontWeight: '500', color: '#9da3ff' },
});
