import React, { useEffect, useRef } from 'react';
import ControlPanel from '../components/control/ControlPanel';
import ChatInterface from '../components/chat/ChatInterface';
import Toast from '../components/ui/Toast';
import SessionRestoreModal from '../components/modals/SessionRestoreModal';
import MobileDrawer from '../components/ui/MobileDrawer';
import { useChat } from '../hooks/useChat';
import { useSession } from '../hooks/useSession';
import { useProfile } from '../hooks/useProfile';
import { Sparkles, BrainCircuit, RefreshCcw, Menu } from 'lucide-react';
import { AnalysisMode } from '../types';

const App: React.FC = () => {
  // Custom Hooks
  const { profile, mode, setProfile, setMode, updateMainProfile } = useProfile();
  const { messages, isLoading, depthScore, sendUserMessage, startSession, switchMode, resetChat, setMessages, setDepthScore } = useChat();
  const { isSessionActive, setIsSessionActive, showRestoreModal, savedSessionData, handleRestoreSession, handleNewSession, autoSaveSession, resetSession } = useSession();

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Track previous mode to detect changes
  const prevModeRef = useRef<AnalysisMode>('integrated');

  // 세션 활성 중 자동 저장
  useEffect(() => {
    autoSaveSession(profile, messages, depthScore, mode);
  }, [messages, mode, depthScore, profile, autoSaveSession]);

  // 세션 복원 핸들러
  const onRestoreSession = () => {
    handleRestoreSession(
      setProfile,
      setMessages,
      setDepthScore,
      setMode,
      (m) => { prevModeRef.current = m; }
    );
  };

  // 세션 시작 핸들러
  const handleStartSession = async () => {
    setIsSessionActive(true);
    await startSession(mode, profile);
  };

  // 모드 변경 핸들러
  const handleModeSelect = (newMode: AnalysisMode) => {
    if (newMode === mode) return;
    setMode(newMode);
  };

  // 모드 변경 Effect
  useEffect(() => {
    if (!isSessionActive) return;
    if (prevModeRef.current === mode) return;

    switchMode(mode, profile);
    prevModeRef.current = mode;
  }, [mode, isSessionActive, switchMode, profile]);

  // 리셋 핸들러
  const handleReset = () => {
    resetSession();
    resetChat();
    prevModeRef.current = 'integrated';
  };

  // 메시지 전송 핸들러
  const handleSendMessage = async (text: string) => {
    if (!isSessionActive) {
      setIsSessionActive(true);
    }
    await sendUserMessage(text, mode, profile);
  };

  return (
    <>
      {/* Toast 알림 시스템 */}
      <Toast />

      {/* 세션 복원 모달 */}
      {showRestoreModal && savedSessionData && (
        <SessionRestoreModal
          timestamp={savedSessionData.timestamp}
          messageCount={savedSessionData.messages.length}
          depthScore={savedSessionData.depthScore}
          onRestore={onRestoreSession}
          onNew={handleNewSession}
        />
      )}

      <div className="flex h-screen w-full bg-void-950 text-gray-100 overflow-hidden font-sans relative">
        {/* Global Background Ambience */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-600/5 rounded-full blur-[100px]"></div>
          <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-indigo-900/10 rounded-full blur-[80px]"></div>
        </div>

        {/* 데스크톱: 사이드바로 ControlPanel 표시 */}
        <div className="hidden md:flex">
          <ControlPanel
            profile={profile}
            setProfile={setProfile}
            mode={mode}
            onModeChange={handleModeSelect}
            onStartSession={handleStartSession}
            onReset={handleReset}
            depthScore={depthScore}
            isSessionActive={isSessionActive}
          />
        </div>

        {/* 모바일: 세션 미시작 시 ControlPanel 직접 표시 */}
        {!isSessionActive && (
          <div className="flex md:hidden w-full">
            <ControlPanel
              profile={profile}
              setProfile={setProfile}
              mode={mode}
              onModeChange={handleModeSelect}
              onStartSession={handleStartSession}
              onReset={handleReset}
              depthScore={depthScore}
              isSessionActive={isSessionActive}
            />
          </div>
        )}

        {/* 모바일: 세션 시작 후 드로어로 ControlPanel 접근 */}
        <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <ControlPanel
            profile={profile}
            setProfile={setProfile}
            mode={mode}
            onModeChange={handleModeSelect}
            onStartSession={handleStartSession}
            onReset={handleReset}
            depthScore={depthScore}
            isSessionActive={isSessionActive}
          />
        </MobileDrawer>

        {/* Main Chat Area */}
        <main className={`flex-1 flex flex-col relative z-10 ${!isSessionActive ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-void-950 via-void-950/80 to-transparent z-20 flex items-center justify-between px-6 pointer-events-none">
            <div className="flex items-center gap-3 text-gold-200 pointer-events-auto">
              {/* 모바일 햄버거 메뉴 (세션 활성 시만) */}
              {isSessionActive && (
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="md:hidden w-8 h-8 rounded-full bg-void-800/80 backdrop-blur-sm flex items-center justify-center border border-void-700 text-gray-400 hover:text-white transition-colors"
                  aria-label="설정 메뉴 열기"
                >
                  <Menu size={16} />
                </button>
              )}

              <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gold-100 to-gold-400 drop-shadow-sm">바이브 철학관</h1>
                <p className="text-[10px] text-gray-500 font-sans tracking-widest uppercase">Vibe Philosophy Agent 3.0</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pointer-events-auto">
              {/* Depth Score (Desktop only) */}
              <div className="hidden md:flex items-center gap-3 glass-panel px-4 py-1.5 rounded-full">
                <Sparkles size={14} className={depthScore >= 90 ? "text-emerald-400 animate-pulse" : "text-gold-400"} />
                <span className="text-xs text-gray-300 font-medium tracking-wide">
                  심층 분석 <span className="mx-1 text-gray-600">|</span> <span className={depthScore >= 90 ? "text-emerald-400 font-bold" : "text-gold-200"}>{depthScore}%</span>
                </span>
              </div>

              {/* Mobile Reset Button */}
              {isSessionActive && (
                <button
                  onClick={handleReset}
                  className="md:hidden w-8 h-8 rounded-full bg-void-800 flex items-center justify-center border border-void-700 text-gray-400 hover:text-white"
                >
                  <RefreshCcw size={14} />
                </button>
              )}
            </div>
          </header>

          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        </main>
      </div>
    </>
  );
};

export default App;
