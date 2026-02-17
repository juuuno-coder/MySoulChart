import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ControlPanel from '../components/control/ControlPanel';
import ChatInterface from '../components/chat/ChatInterface';
import LandingPage from '../components/pages/LandingPage';
import ConversationalForm from '../components/forms/ConversationalForm';
import ProductFormSidebar from '../components/sidebars/ProductFormSidebar';
import Toast from '../components/ui/Toast';
import MobileDrawer from '../components/ui/MobileDrawer';
import LoadingOverlay from '../components/ui/LoadingOverlay';

// Lazy loaded components (무거운 컴포넌트들)
const ChartDashboard = lazy(() => import('../components/chart/ChartDashboard'));
const ViewChart = lazy(() => import('../components/pages/ViewChart'));
const SessionRestoreModal = lazy(() => import('../components/modals/SessionRestoreModal'));
const OnboardingModal = lazy(() => import('../components/modals/OnboardingModal'));
import { useChat } from '../hooks/useChat';
import { useSession } from '../hooks/useSession';
import { useProfile } from '../hooks/useProfile';
import { useChart } from '../hooks/useChart';
import { useRouter } from '../hooks/useRouter';
import { useSessionStartTracking, useModeSwitch, useMessageTracking } from '../hooks/useAnalytics';
import { Sparkles, BrainCircuit, RefreshCcw, Menu, Home } from 'lucide-react';
import { AnalysisMode, UserProfile } from '../types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { validateProfile } from '../utils/validation';
import { showToast } from '../utils/toast';

const App: React.FC = () => {
  // Custom Hooks
  const { profile, mode, setProfile, setMode, updateMainProfile } = useProfile();
  const { messages, isLoading, depthScore, sendUserMessage, startSession, switchMode, resetChat, setMessages, setDepthScore } = useChat();
  const { isSessionActive, setIsSessionActive, showRestoreModal, savedSessionData, handleRestoreSession, handleNewSession, autoSaveSession, resetSession } = useSession();
  const { currentRoute, navigate } = useRouter();
  const { chart, isLoading: isChartLoading, loadChart, completeAnalysis, isAnalysisCompleted } = useChart();

  // Analytics Hooks
  useSessionStartTracking(mode, !!profile.name);
  useModeSwitch(mode);
  const trackMessage = useMessageTracking();

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Track previous mode to detect changes
  const prevModeRef = useRef<AnalysisMode>('integrated');

  // 세션 활성 중 자동 저장
  useEffect(() => {
    autoSaveSession(profile, messages, depthScore, mode);
  }, [messages, mode, depthScore, profile, autoSaveSession]);

  // 모바일 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // 초기 체크
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 로그인 상태 추적 및 차트 로드
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        loadChart();
      }
    });
    return () => unsubscribe();
  }, [loadChart]);

  // 첫 방문 감지 (온보딩 모달)
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding && currentRoute.path === 'home') {
      // 첫 방문 시 온보딩 모달 표시 (약간의 딜레이)
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentRoute]);

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
    // GA4 추적: 메시지 전송
    trackMessage(mode, text.length, Math.floor(messages.length / 2) + 1);
    await sendUserMessage(text, mode, profile);
  };

  // 상품 선택 핸들러 (LandingPage에서 호출)
  const handleSelectProduct = (productId: string) => {
    // productId를 AnalysisMode로 매핑
    const modeMap: Record<string, AnalysisMode> = {
      'face': 'face',
      'saju': 'saju',
      'zodiac': 'zodiac',
      'mbti': 'mbti',
      'bloodtype': 'blood',
      'couple': 'couple',
      'integrated': 'integrated',
    };

    const analysisMode = modeMap[productId] || 'integrated';
    setMode(analysisMode);
    navigate({ path: 'chat', mode: analysisMode });
    setIsSessionActive(false);
    resetChat();
  };

  // 상품 입력 폼 제출 핸들러
  const handleProductFormSubmit = async (formData: Partial<UserProfile>) => {
    // 병합된 프로필로 검증
    const mergedProfile = { ...profile, ...formData };

    // 폼 검증
    const validation = validateProfile(mode, mergedProfile);

    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join('\n');
      showToast('warning', `필수 정보를 입력해주세요:\n${errorMessages}`);
      return;
    }

    // 프로필 업데이트
    setProfile(mergedProfile as UserProfile);

    // 세션 시작
    setIsSessionActive(true);
    await startSession(mode, mergedProfile as UserProfile);
  };

  // 상품 입력 폼 취소 핸들러
  const handleProductFormCancel = () => {
    navigate({ path: 'home' });
  };

  // 분석 시작 핸들러 (ChartDashboard에서 호출)
  const handleStartAnalysisFromChart = (analysisMode: AnalysisMode) => {
    setMode(analysisMode);
    navigate({ path: 'chat', mode: analysisMode });
    setIsSessionActive(false); // 새로운 세션 시작
    resetChat();
  };

  // 분석 완료 핸들러 (ChatInterface에서 호출)
  const handleAnalysisComplete = async () => {
    if (!chart || !auth.currentUser) return;

    // 현재 분석이 이미 완료되었는지 확인
    if (isAnalysisCompleted(mode)) {
      // 이미 완료된 분석이면 그냥 홈으로 이동
      navigate({ path: 'home' });
      return;
    }

    // 분석 결과 저장
    const analysisResult = {
      mode,
      completedAt: new Date(),
      cardData: {
        userName: profile.name || '도인',
        mode,
        headline: `${profile.name || '도인'}님의 ${mode === 'face' ? '관상' : mode === 'zodiac' ? '별자리' : mode === 'mbti' ? 'MBTI' : mode === 'saju' ? '사주' : '혈액형'} 분석`,
        traits: [],
        advice: messages[messages.length - 1]?.text || '',
        luckyItems: { color: '', number: 0, direction: '' },
        depthScore,
      },
      summary: messages[messages.length - 1]?.text?.slice(0, 100) || '',
      depthScore,
    };

    await completeAnalysis(mode, analysisResult);

    // 홈으로 복귀
    navigate({ path: 'home' });
    setIsSessionActive(false);
    resetChat();
  };

  return (
    <>
      {/* Toast 알림 시스템 */}
      <Toast />

      {/* 로딩 오버레이 (세션 시작 중) */}
      <AnimatePresence>
        {isLoading && !isSessionActive && (
          <LoadingOverlay message="영혼의 문을 여는 중..." />
        )}
      </AnimatePresence>

      {/* 세션 복원 모달 */}
      {showRestoreModal && savedSessionData && (
        <Suspense fallback={null}>
          <SessionRestoreModal
            timestamp={savedSessionData.timestamp}
            messageCount={savedSessionData.messages.length}
            depthScore={savedSessionData.depthScore}
            onRestore={onRestoreSession}
            onNew={handleNewSession}
          />
        </Suspense>
      )}

      {/* 온보딩 모달 */}
      <Suspense fallback={null}>
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </Suspense>

      <div className="flex flex-row-reverse h-screen w-full bg-cosmic-950 text-gray-100 overflow-hidden font-sans relative">
        {/* Global Background Ambience */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-nebula-500/5 rounded-full blur-[100px]"></div>
          <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-indigo-900/10 rounded-full blur-[80px]"></div>
        </div>

        {/* ControlPanel (chat 라우트에서만 표시) */}
        {currentRoute.path === 'chat' && (
          <>
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
          </>
        )}

        {/* Main Content Area - Route based rendering */}
        <main className={`flex-1 flex flex-col relative z-10 ${!isSessionActive && currentRoute.path === 'home' ? 'hidden md:flex' : 'flex'}`}>
          <AnimatePresence mode="wait">
            {/* Route: View Chart (권한으로 타인 차트 보기) */}
            {currentRoute.path === 'view' && (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <Suspense fallback={<LoadingOverlay message="차트를 불러오는 중..." />}>
                  <ViewChart permissionId={currentRoute.permissionId} />
                </Suspense>
              </motion.div>
            )}

            {/* Route: Chat (분석 진행 중) */}
            {currentRoute.path === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <>
                  {!isSessionActive ? (
                /* 세션 시작 전: 대화형 입력 + 사이드바 */
                <>
                  {/* 입력 사이드바 (PC만, 오른쪽) */}
                  <aside className="hidden lg:block w-96 h-screen overflow-y-auto bg-cosmic-900/50 border-l border-cosmic-800">
                    <ProductFormSidebar
                      mode={mode}
                      profile={profile}
                      onChange={updateMainProfile}
                      completedAnalyses={chart?.completedCount || 0}
                    />
                  </aside>

                  {/* 메인 컨텐츠 (대화형 입력) */}
                  <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-4 py-16 overflow-y-auto">
                    {/* 홈 버튼 */}
                    <button
                      onClick={() => navigate({ path: 'home' })}
                      className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl border border-cosmic-700 text-starlight-300 hover:bg-cosmic-800/50 transition-colors z-20"
                    >
                      <Home className="w-4 h-4" />
                      <span className="hidden md:inline">홈으로</span>
                    </button>

                    <ConversationalForm
                      mode={mode}
                      profile={profile}
                      onSubmit={handleProductFormSubmit}
                      onCancel={handleProductFormCancel}
                      onChange={updateMainProfile}
                    />
                  </div>
                </>
              ) : (
                /* 세션 활성 중: 채팅 인터페이스 */
                <>
                  {/* Header */}
                  <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-cosmic-950 via-cosmic-950/80 to-transparent z-20 flex items-center justify-between px-6 pointer-events-none">
                    <div className="flex items-center gap-3 text-nebula-200 pointer-events-auto">
                      {/* 홈 버튼 */}
                      <button
                        onClick={() => navigate({ path: 'home' })}
                        className="w-8 h-8 rounded-full bg-cosmic-800/80 backdrop-blur-sm flex items-center justify-center border border-cosmic-700 text-gray-400 hover:text-white transition-colors"
                        aria-label="홈으로"
                      >
                        <Home size={16} />
                      </button>

                      {/* 모바일 햄버거 메뉴 */}
                      <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="md:hidden w-8 h-8 rounded-full bg-cosmic-800/80 backdrop-blur-sm flex items-center justify-center border border-cosmic-700 text-gray-400 hover:text-white transition-colors"
                        aria-label="설정 메뉴 열기"
                      >
                        <Menu size={16} />
                      </button>

                      <div className="w-8 h-8 rounded-full bg-nebula-500/10 flex items-center justify-center border border-nebula-500/20 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                        <BrainCircuit className="w-4 h-4" />
                      </div>
                      <div>
                        <h1 className="font-serif font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-starlight-200 to-nebula-400 drop-shadow-sm">My Soul Chart</h1>
                        <p className="text-[10px] text-gray-500 font-sans tracking-widest uppercase">Soul Analysis</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pointer-events-auto">
                      {/* Depth Score (Desktop only) */}
                      <div className="hidden md:flex items-center gap-3 glass-panel px-4 py-1.5 rounded-full">
                        <Sparkles size={14} className={depthScore >= 90 ? "text-emerald-400 animate-pulse" : "text-nebula-400"} />
                        <span className="text-xs text-gray-300 font-medium tracking-wide">
                          심층 분석 <span className="mx-1 text-gray-600">|</span> <span className={depthScore >= 90 ? "text-emerald-400 font-bold" : "text-nebula-200"}>{depthScore}%</span>
                        </span>
                      </div>

                      {/* Reset Button */}
                      <button
                        onClick={handleReset}
                        className="w-8 h-8 rounded-full bg-cosmic-800 flex items-center justify-center border border-cosmic-700 text-gray-400 hover:text-white"
                        aria-label="초기화"
                      >
                        <RefreshCcw size={14} />
                      </button>
                    </div>
                  </header>

                  <ChatInterface
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                  />
                </>
              )}
                </>
              </motion.div>
            )}

            {/* Route: Home (랜딩페이지) */}
            {currentRoute.path === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <LandingPage onSelectProduct={handleSelectProduct} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default App;
