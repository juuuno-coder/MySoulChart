import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingTracking } from '../../hooks/useAnalytics';
import {
  Sparkles,
  Brain,
  Star,
  Dna,
  Activity,
  ScrollText,
  ScanFace,
  Heart,
  X,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 온보딩 모달 - 첫 방문 사용자 가이드
 */
export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const trackOnboarding = useOnboardingTracking();

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('onboarding_completed', 'true');
    }
    // GA4 추적: 온보딩 완료 (최종 단계까지 본 경우만)
    if (currentStep === 2) {
      trackOnboarding(currentStep + 1); // 1-based (3단계)
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const modes = [
    { id: 'integrated', icon: Brain, label: '통합 점사', desc: '모든 데이터를 종합 분석' },
    { id: 'zodiac', icon: Star, label: '별자리', desc: '서양 점성술 운세' },
    { id: 'blood', icon: Dna, label: '혈액형', desc: '성격 심리 분석' },
    { id: 'mbti', icon: Activity, label: 'MBTI', desc: '동양 철학적 해석' },
    { id: 'saju', icon: ScrollText, label: '사주', desc: '생년월일시 기반' },
    { id: 'face', icon: ScanFace, label: '관상', desc: '얼굴 기운 분석' },
    { id: 'couple', icon: Heart, label: '궁합', desc: '두 사람의 궁합' },
  ];

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowLeft':
          if (currentStep > 0) {
            e.preventDefault();
            handlePrev();
          }
          break;
        case 'ArrowRight':
          if (currentStep < 2) {
            e.preventDefault();
            handleNext();
          }
          break;
        case 'Enter':
          e.preventDefault();
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-gradient-to-br from-void-900/95 via-cosmic-900/95 to-void-950/95 backdrop-blur-xl rounded-2xl border border-nebula-500/30 shadow-[0_0_40px_rgba(212,175,55,0.3)] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10"
              aria-label="온보딩 닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 단계 표시 */}
            <div className="absolute top-6 left-0 right-0 flex justify-center gap-2 z-10">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-1 w-12 rounded-full transition-all ${
                    step === currentStep
                      ? 'bg-nebula-400'
                      : step < currentStep
                      ? 'bg-nebula-600'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* 컨텐츠 */}
            <div className="p-8 pt-16 min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <Sparkles className="w-16 h-16 text-nebula-400" />
                    <h2 className="text-3xl font-bold text-nebula-200 font-serif">
                      영혼 차트에 오신 것을 환영합니다
                    </h2>
                    <p className="text-lg text-gold-200/80 max-w-lg leading-relaxed">
                      천 년의 지혜를 담은 AI 도사가<br />
                      그대의 영혼을 깊이 들여다봅니다.
                    </p>
                    <p className="text-sm text-gray-400 max-w-md">
                      관상, 별자리, MBTI, 사주, 혈액형을 종합하여<br />
                      당신만의 영혼 차트를 만들어드립니다.
                    </p>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-nebula-200 font-serif text-center">
                      7가지 상담 모드
                    </h2>
                    <p className="text-sm text-gray-400 text-center">
                      원하는 모드를 선택하여 심층 분석을 받아보세요
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {modes.map((mode) => {
                        const Icon = mode.icon;
                        return (
                          <div
                            key={mode.id}
                            className="p-4 bg-cosmic-900/50 border border-cosmic-700 rounded-lg hover:border-nebula-500/50 transition-colors"
                          >
                            <Icon className="w-6 h-6 text-nebula-400 mb-2" />
                            <h3 className="text-sm font-bold text-nebula-200 mb-1">
                              {mode.label}
                            </h3>
                            <p className="text-xs text-gray-500">{mode.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-6"
                  >
                    <Brain className="w-16 h-16 text-nebula-400" />
                    <h2 className="text-2xl font-bold text-nebula-200 font-serif text-center">
                      프로필을 입력하고<br />
                      상담을 시작하세요
                    </h2>
                    <div className="space-y-3 text-sm text-gray-300 max-w-md">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-nebula-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-nebula-300">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-nebula-200">상담 모드 선택</p>
                          <p className="text-xs text-gray-500">왼쪽 사이드바에서 원하는 모드를 선택하세요</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-nebula-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-nebula-300">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-nebula-200">프로필 입력</p>
                          <p className="text-xs text-gray-500">이름, 생년월일 등 필요한 정보를 입력하세요</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-nebula-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-nebula-300">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-nebula-200">AI 도사와 대화</p>
                          <p className="text-xs text-gray-500">자유롭게 질문하고 깊은 통찰을 얻으세요</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 하단 버튼 */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-cosmic-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dont-show-again"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-cosmic-900 text-nebula-500 focus:ring-nebula-500 focus:ring-offset-0"
                  />
                  <label htmlFor="dont-show-again" className="text-sm text-gray-400 cursor-pointer">
                    다시 보지 않기
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      이전
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2 bg-nebula-500/20 hover:bg-nebula-500/30 text-nebula-200 rounded-lg font-medium transition-colors border border-nebula-500/30"
                  >
                    {currentStep < 2 ? '다음' : '시작하기'}
                    {currentStep < 2 && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
