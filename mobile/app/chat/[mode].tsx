import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Message, UserProfile, AnalysisMode } from '../../shared/types';
import { sendMessage, initializeSession } from '../../shared/services/api';

const MODE_NAMES: Record<string, string> = {
  face: '관상 분석', zodiac: '별자리', mbti: 'MBTI',
  saju: '사주명리', blood: '혈액형', couple: '커플 궁합',
  unified: '통합 영혼 상담',
};

export default function ChatScreen() {
  const params = useLocalSearchParams<{ mode: string; profile: string }>();
  const router = useRouter();
  const mode = (params.mode || 'unified') as AnalysisMode;
  const profile: UserProfile = params.profile ? JSON.parse(params.profile) : {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [depth, setDepth] = useState(0);
  const [showCardPrompt, setShowCardPrompt] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // 세션 시작 - 첫 AI 인사
  useEffect(() => {
    const start = async () => {
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
    start();
  }, []);

  // 메시지 전송
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessage(
        text,
        mode,
        profile,
        [...messages, userMessage]
      );

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: response.text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setDepth(response.depth);
      if (response.depth >= 100) {
        setShowCardPrompt(true);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: '영혼의 문이 잠시 흔들렸구나... 다시 시도해보게.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  }, [inputText, isLoading, messages, mode, profile]);

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

  // 메시지 렌더링
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && <Text style={styles.aiLabel}>🔮 도사</Text>}
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: MODE_NAMES[mode] || '상담' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
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
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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

        {/* 로딩 */}
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#9333ea" size="small" />
            <Text style={styles.loadingText}> 영혼을 읽는 중...</Text>
          </View>
        )}

        {/* 입력 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="무엇이든 물어보세요..."
              placeholderTextColor="#9da3ff40"
              multiline
              maxLength={2000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
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
  messageBubble: {
    maxWidth: '85%', marginBottom: 12, padding: 14,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: '#1a1a42',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start', backgroundColor: '#12122e',
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#1a1a4280',
  },
  aiLabel: { fontSize: 11, color: '#9333ea', fontWeight: '600', marginBottom: 6 },
  messageText: { fontSize: 15, lineHeight: 24 },
  userText: { color: '#e8eaff' },
  aiText: { color: '#c8ccff' },
  timestamp: { fontSize: 10, color: '#9da3ff40', marginTop: 6, textAlign: 'right' },
  // Loading
  loadingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  loadingText: { fontSize: 13, color: '#9da3ff60' },
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
