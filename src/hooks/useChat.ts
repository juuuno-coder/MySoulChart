import { useState, useRef, useCallback, useEffect } from 'react';
import { Message, AnalysisMode, UserProfile } from '../types';
import { sendMessage, initializeSession } from '../services/api';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  depthScore: number;
  sendUserMessage: (text: string, mode: AnalysisMode, profile: UserProfile) => Promise<void>;
  startSession: (mode: AnalysisMode, profile: UserProfile) => Promise<void>;
  switchMode: (mode: AnalysisMode, profile: UserProfile) => Promise<void>;
  resetChat: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setDepthScore: React.Dispatch<React.SetStateAction<number>>;
}

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [depthScore, setDepthScore] = useState(0);

  const messagesRef = useRef<Message[]>([]);

  // Sync messages with ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * 세션 시작 (인사말 생성)
   */
  const startSession = useCallback(async (mode: AnalysisMode, profile: UserProfile) => {
    setIsLoading(true);
    setDepthScore(10);
    setMessages([]);
    messagesRef.current = [];

    try {
      const response = await initializeSession(mode, profile);

      if (response.text) {
        setMessages([{
          id: `init-greeting-${Date.now()}`,
          role: 'model',
          text: response.text,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error("Failed to start session", error);
      setMessages([{
        id: 'error-init',
        role: 'model',
        text: "기가 흐트러져서 목소리가 안 나오는구나... 다시 시도해주겠나?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 모드 전환 (새 인사말 생성)
   */
  const switchMode = useCallback(async (mode: AnalysisMode, profile: UserProfile) => {
    setIsLoading(true);

    try {
      const response = await initializeSession(mode, profile);

      if (response.text) {
        setMessages(prev => [...prev, {
          id: `mode-greeting-${Date.now()}`,
          role: 'model',
          text: response.text,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error("Failed to generate mode greeting", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 사용자 메시지 전송
   */
  const sendUserMessage = useCallback(async (
    text: string,
    mode: AnalysisMode,
    profile: UserProfile
  ) => {
    const newUserMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // 서버 API로 메시지 전송 (히스토리 포함)
      const currentMessages = [...messagesRef.current, newUserMsg];
      const response = await sendMessage(text, mode, profile, currentMessages);

      if (response.depth !== null) {
        setDepthScore(response.depth);
      } else {
        setDepthScore(prev => Math.min(prev + 3, 90));
      }

      const newModelMsg: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: response.text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newModelMsg]);
    } catch (error) {
      console.error("Error in chat flow", error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'model',
        text: "통신 상태가 불안정합니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 채팅 리셋
   */
  const resetChat = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setDepthScore(0);
  }, []);

  return {
    messages,
    isLoading,
    depthScore,
    sendUserMessage,
    startSession,
    switchMode,
    resetChat,
    setMessages,
    setDepthScore,
  };
};
