import { useState, useEffect, useCallback } from 'react';
import { Message, UserProfile, AnalysisMode } from '../types';
import { saveSession, loadSession, clearSession, SessionData } from '../utils/storage';
import { showToast } from '../utils/toast';

interface UseSessionReturn {
  isSessionActive: boolean;
  setIsSessionActive: (active: boolean) => void;
  showRestoreModal: boolean;
  savedSessionData: SessionData | null;
  handleRestoreSession: (
    setProfile: (profile: UserProfile) => void,
    setMessages: (messages: Message[]) => void,
    setDepthScore: (score: number) => void,
    setMode: (mode: AnalysisMode) => void,
    setPrevModeRef: (mode: AnalysisMode) => void
  ) => void;
  handleNewSession: () => void;
  autoSaveSession: (profile: UserProfile, messages: Message[], depthScore: number, mode: AnalysisMode) => void;
  resetSession: () => void;
}

export const useSession = (): UseSessionReturn => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<SessionData | null>(null);

  // 초기 마운트 시 저장된 세션 확인
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.messages.length > 0) {
      setSavedSessionData(saved);
      setShowRestoreModal(true);
    }
  }, []);

  /**
   * 세션 복원 처리
   */
  const handleRestoreSession = useCallback((
    setProfile: (profile: UserProfile) => void,
    setMessages: (messages: Message[]) => void,
    setDepthScore: (score: number) => void,
    setMode: (mode: AnalysisMode) => void,
    setPrevModeRef: (mode: AnalysisMode) => void
  ) => {
    if (!savedSessionData) return;

    setProfile(savedSessionData.profile);
    setMessages(savedSessionData.messages);
    setDepthScore(savedSessionData.depthScore);
    setMode(savedSessionData.mode);
    setIsSessionActive(true);
    setPrevModeRef(savedSessionData.mode);

    setShowRestoreModal(false);
    setSavedSessionData(null);
    showToast('success', '이전 상담을 이어서 진행합니다.');
  }, [savedSessionData]);

  /**
   * 새로 시작 (저장된 세션 삭제)
   */
  const handleNewSession = useCallback(() => {
    clearSession();
    setShowRestoreModal(false);
    setSavedSessionData(null);
  }, []);

  /**
   * 세션 자동 저장 (메시지, 모드, 깊이 점수 변경 시)
   */
  const autoSaveSession = useCallback((
    profile: UserProfile,
    messages: Message[],
    depthScore: number,
    mode: AnalysisMode
  ) => {
    if (isSessionActive && messages.length > 0) {
      saveSession({ profile, messages, depthScore, mode });
    }
  }, [isSessionActive]);

  /**
   * 세션 리셋
   */
  const resetSession = useCallback(() => {
    setIsSessionActive(false);
    clearSession();
  }, []);

  return {
    isSessionActive,
    setIsSessionActive,
    showRestoreModal,
    savedSessionData,
    handleRestoreSession,
    handleNewSession,
    autoSaveSession,
    resetSession,
  };
};
