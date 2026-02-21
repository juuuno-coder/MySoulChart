import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

type ModeItem = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
};

const MODES: ModeItem[] = [
  { id: 'unified', icon: '🔮', title: '통합 영혼 상담', subtitle: '모든 분석을 하나의 대화로', color: '#9333ea' },
  { id: 'face', icon: '👁️', title: '관상 분석', subtitle: '얼굴에 새겨진 운명', color: '#ec4899' },
  { id: 'saju', icon: '📜', title: '사주명리', subtitle: '생년월일로 보는 팔자', color: '#f59e0b' },
  { id: 'zodiac', icon: '⭐', title: '별자리', subtitle: '별이 말하는 운명', color: '#3b82f6' },
  { id: 'mbti', icon: '🧠', title: 'MBTI 분석', subtitle: '인지기능으로 보는 내면', color: '#10b981' },
  { id: 'blood', icon: '💉', title: '혈액형', subtitle: '피에 흐르는 기질', color: '#ef4444' },
  { id: 'couple', icon: '💕', title: '커플 궁합', subtitle: '두 영혼의 케미스트리', color: '#f472b6' },
];

export default function HomeScreen() {
  const router = useRouter();

  const handleModeSelect = (modeId: string) => {
    router.push(`/form/${modeId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.logo}>✦</Text>
          <Text style={styles.title}>My Soul Chart</Text>
          <Text style={styles.subtitle}>
            AI가 읽어주는 당신의 영혼
          </Text>
        </View>

        {/* 통합 상담 (메인 CTA) */}
        <TouchableOpacity
          style={[styles.mainCard, { borderColor: MODES[0].color + '40' }]}
          onPress={() => handleModeSelect('unified')}
          activeOpacity={0.8}
        >
          <Text style={styles.mainCardIcon}>{MODES[0].icon}</Text>
          <View style={styles.mainCardText}>
            <Text style={styles.mainCardTitle}>{MODES[0].title}</Text>
            <Text style={styles.mainCardSubtitle}>{MODES[0].subtitle}</Text>
          </View>
          <View style={[styles.mainCardBadge, { backgroundColor: MODES[0].color }]}>
            <Text style={styles.mainCardBadgeText}>추천</Text>
          </View>
        </TouchableOpacity>

        {/* 개별 분석 모드 */}
        <Text style={styles.sectionTitle}>개별 분석</Text>
        <View style={styles.grid}>
          {MODES.slice(1).map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.modeCard}
              onPress={() => handleModeSelect(mode.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.modeIcon}>{mode.icon}</Text>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 하단 안내 */}
        <Text style={styles.footer}>
          AI는 운명의 조언자일 뿐, 선택은 당신의 몫입니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e8eaff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#9da3ff',
    opacity: 0.7,
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
  },
  mainCardIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  mainCardText: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e8eaff',
    marginBottom: 4,
  },
  mainCardSubtitle: {
    fontSize: 13,
    color: '#9da3ff',
    opacity: 0.7,
  },
  mainCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mainCardBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9da3ff',
    marginBottom: 16,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  modeCard: {
    width: '48%',
    backgroundColor: '#12122e',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1a1a42',
  },
  modeIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e8eaff',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 12,
    color: '#9da3ff',
    opacity: 0.6,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9da3ff',
    opacity: 0.4,
    marginTop: 32,
  },
});
