import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, UserProfile, AnalysisMode } from '../../shared/types';
import { sendMessage, initializeSession } from '../../shared/services/api';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { useNetwork } from '../../hooks/useNetwork';
import OfflineBanner from '../../components/ui/OfflineBanner';
import { showToast } from '../../shared/utils/toast';

const MODE_NAMES: Record<string, string> = {
  face: '관상 분석', zodiac: '별자리', mbti: 'MBTI',
  saju: '사주명리', blood: '혈액형', couple: '커플 궁합',
  unified: '통합 영혼 상담',
};

export default function ChatScreen() {
  const params = useLocalSearchParams<{ mode: string; profile: string }>();
  const router = useRouter();
  const mode = (params.mode || 'unified') as AnalysisMode;
  const profile: UserProfile = (() => {
    if (!params.profile) return {} as UserProfile;
    try { return JSON.parse(params.profile); } catch { return {} as UserProfile; }
  })();

  const isConnected = useNetwork();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [depth, setDepth] = useState(0);
  const [showCardPrompt, setShowCardPrompt] = useState(false);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionKey = `@mysoulchart/session_${mode}`;

  // 세션 복원 (AsyncStorage)
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(sessionKey);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.messages?.length > 0) {
            setMessages(data.messages);
            setDepth(data.depth || 0);
            if (data.depth >= 100) setShowCardPrompt(true);
            return; // 복원 성공 시 초기화 스킵
          }
        }
      } catch {}

      // 저장된 세션 없으면 새로 시작
      setIsLoading(true);
      try {
        const response = await initializeSession(mode, profile);
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'model',
          text: response.text,
          timestamp: new Date(),
        };
        setMessages([aiMessage]);
        setDepth(response.depth);
      } catch (error) {
        const errorMessage: Message = {
          id: `err-${Date.now()}`,
          role: 'model',
          text: '영혼의 문이 잠시 흔들렸구나... 다시 시도해보게.',
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      }
      setIsLoading(false);
    };
    restore();

    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // 세션 자동저장 (메시지 변경 시)
  useEffect(() => {
    if (messages.length === 0) return;
    AsyncStorage.setItem(sessionKey, JSON.stringify({ messages, depth })).catch(() => {});
  }, [messages, depth]);

  // 메시지 전송 (재시도 지원)
  const handleSend = useCallback(async (retryText?: string) => {
    const text = retryText || inputText.trim();
    if (!text || isLoading) return;

    if (!isConnected) {
      showToast('warning', '네트워크 연결을 확인해주세요');
      return;
    }

    // 재시도 시 이전 에러 메시지 제거
    if (retryText) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.id.startsWith('err-')) return prev.slice(0, -1);
        return prev;
      });
      setLastFailedText(null);
    }

    // 재시도가 아닌 경우만 사용자 메시지 추가
    const existingUserMsgs = retryText ? messages : [];
    const userMessage: Message = retryText
      ? messages[messages.length - 1]?.role === 'user'
        ? messages[messages.length - 1]
        : { id: `user-${Date.now()}`, role: 'user', text, timestamp: new Date() }
      : { id: `user-${Date.now()}`, role: 'user', text, timestamp: new Date() };

    if (!retryText) {
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
    }
    setIsLoading(true);

    try {
      const historyForApi = retryText ? messages.filter(m => !m.id.startsWith('err-')) : [...messages, userMessage];
      const response = await sendMessage(text, mode, profile, historyForApi);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: response.text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setDepth(response.depth);
      setLastFailedText(null);
      if (response.depth >= 100) {
        setShowCardPrompt(true);
      }
    } catch (error: any) {
      setLastFailedText(text);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: '영혼의 문이 잠시 흔들렸구나... 다시 시도해보게.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  }, [inputText, isLoading, isConnected, messages, mode, profile]);

  // 결과 카드 화면으로 이동
  const handleGoToCard = () => {
    const historyForCard = messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      text: m.text,
    }));
    router.push({
      pathname: '/card/[mode]',
      params: {
        mode,
        profile: JSON.stringify(profile),
        history: JSON.stringify(historyForCard),
        depth: String(depth),
      },
    });
  };

  // 메시지 렌더링 (MessageBubble 컴포넌트 사용)
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    []
  );

  // 스크롤 디바운스
  const handleContentSizeChange = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: MODE_NAMES[mode] || '상담' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* 오프라인 배너 */}
        {!isConnected && <OfflineBanner />}

        {/* 심도 게이지 */}
        <View style={styles.depthBar}>
          <Text style={styles.depthLabel}>{MODE_NAMES[mode]}</Text>
          <View style={styles.depthTrack}>
            <View style={[styles.depthFill, { width: `${depth}%` }]} />
          </View>
          <Text style={styles.depthValue}>{depth}%</Text>
        </View>

        {/* 메시지 목록 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={handleContentSizeChange}
        />

        {/* 카드 생성 프롬프트 */}
        {showCardPrompt && (
          <View style={styles.cardPrompt}>
            <Text style={styles.cardPromptText}>분석이 완료되었습니다!</Text>
            <TouchableOpacity style={styles.cardPromptBtn} onPress={handleGoToCard}>
              <Text style={styles.cardPromptBtnText}>결과 카드 보기 ✦</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 재시도 버튼 */}
        {lastFailedText && !isLoading && (
          <TouchableOpacity style={styles.retryRow} onPress={() => handleSend(lastFailedText)}>
            <Text style={styles.retryText}>다시 시도하기</Text>
          </TouchableOpacity>
        )}

        {/* 로딩 */}
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#9333ea" size="small" />
            <Text style={styles.loadingText}> 영혼을 읽는 중...</Text>
          </View>
        )}

        {/* 입력 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {inputText.length > 0 && (
            <View style={styles.charCountRow}>
              <Text style={[
                styles.charCount,
                inputText.length >= 1800 && styles.charCountWarning,
              ]}>
                {inputText.length}/2000
              </Text>
            </View>
          )}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="무엇이든 물어보세요..."
              placeholderTextColor="#9da3ff40"
              multiline
              maxLength={2000}
              onSubmitEditing={() => handleSend()}
              accessibilityLabel="메시지 입력"
              accessibilityHint="질문이나 답변을 입력하세요"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              accessibilityLabel="전송"
              accessibilityRole="button"
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  // Depth gauge
  depthBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingHorizontal: 16,
    backgroundColor: '#12122e', borderBottomWidth: 1, borderBottomColor: '#1a1a42',
  },
  depthLabel: { fontSize: 13, color: '#9da3ff', fontWeight: '600', marginRight: 12 },
  depthTrack: {
    flex: 1, height: 6, backgroundColor: '#1a1a42', borderRadius: 3, overflow: 'hidden',
  },
  depthFill: { height: '100%', backgroundColor: '#9333ea', borderRadius: 3 },
  depthValue: { fontSize: 13, color: '#c084fc', fontWeight: '700', marginLeft: 8, width: 36, textAlign: 'right' },
  // Messages
  messageList: { padding: 16, paddingBottom: 8 },
  // Retry
  retryRow: {
    alignItems: 'center', paddingVertical: 10,
    backgroundColor: '#1a1a42', marginHorizontal: 16, borderRadius: 10,
    marginBottom: 4,
  },
  retryText: { fontSize: 14, color: '#c084fc', fontWeight: '600' },
  // Loading
  loadingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  loadingText: { fontSize: 13, color: '#9da3ff60' },
  // Char counter
  charCountRow: { alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 4 },
  charCount: { fontSize: 11, color: '#9da3ff60' },
  charCountWarning: { color: '#ef4444', fontWeight: '600' },
  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, paddingHorizontal: 16,
    backgroundColor: '#12122e', borderTopWidth: 1, borderTopColor: '#1a1a42',
  },
  input: {
    flex: 1, maxHeight: 100, borderWidth: 1, borderColor: '#1a1a42',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#e8eaff', backgroundColor: '#0a0a1a',
  },
  sendBtn: {
    marginLeft: 8, width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#9333ea', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.3 },
  sendIcon: { fontSize: 18, color: '#fff' },
  // Card prompt
  cardPrompt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#1a1a42', borderTopWidth: 1, borderTopColor: '#9333ea40',
  },
  cardPromptText: { fontSize: 14, color: '#c084fc', fontWeight: '600' },
  cardPromptBtn: {
    backgroundColor: '#9333ea', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  cardPromptBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
