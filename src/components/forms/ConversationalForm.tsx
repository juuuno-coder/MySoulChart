import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, AnalysisMode, CalendarType, PersonData } from '../../types';
import { Sparkles, ArrowRight, Upload, UserCheck, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AceternityInput } from '../ui/AceternityInput';
import AceternityDateSelector from '../ui/AceternityDateSelector';
import { loadProfile } from '../../utils/storage';
import { validateProfile } from '../../utils/validation';
import { analyzeFace } from '../../services/api';
import { showToast } from '../../utils/toast';

interface ConversationalFormProps {
  mode: AnalysisMode;
  profile: UserProfile;
  onSubmit: (profile: Partial<UserProfile>) => void;
  onCancel: () => void;
  onChange: (profile: Partial<UserProfile>) => void;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'date' | 'select' | 'time' | 'file';
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

const DEFAULT_PARTNER: PersonData = {
  name: '', birthDate: '', calendarType: 'solar', birthTime: '',
  birthPlace: '', bloodType: '', mbti: '', gender: 'other',
};

export default function ConversationalForm({ mode, profile, onSubmit, onCancel, onChange }: ConversationalFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [currentValue, setCurrentValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 재방문 사용자 감지
  const [showReturningCard, setShowReturningCard] = useState(false);
  const [savedProfile, setSavedProfile] = useState<Partial<UserProfile> | null>(null);

  useEffect(() => {
    const stored = loadProfile();
    if (stored && stored.name) {
      // 현재 모드에 필요한 필드가 충분한지 검증
      const validation = validateProfile(mode, stored);
      if (validation.isValid) {
        setSavedProfile(stored);
        setShowReturningCard(true);
      }
    }
  }, [mode]);

  // 질문 ID → 프로필 업데이트 매핑
  const mapToProfile = (questionId: string, value: string): Partial<UserProfile> => {
    if (questionId.startsWith('partner')) {
      const field = questionId.charAt(7).toLowerCase() + questionId.slice(8);
      return {
        partner: {
          ...(profile.partner || DEFAULT_PARTNER),
          [field]: value,
        } as PersonData,
      };
    }
    return { [questionId]: value };
  };

  // 모드별 질문 구성
  const getQuestions = (): Question[] => {
    const questions: Question[] = [];

    // === 통합 상담 모드: 한 번에 모든 정보 수집 ===
    if (mode === 'unified') {
      questions.push({
        id: 'name',
        text: '이름을 알려주시게.\n영혼 차트에 새길 이름이니.',
        type: 'text',
        required: true,
        placeholder: '예: 홍길동',
      });

      questions.push({
        id: 'gender',
        text: '성별을 알려주시게.',
        type: 'select',
        required: true,
        options: [
          { value: 'male', label: '남성' },
          { value: 'female', label: '여성' },
        ],
      });

      questions.push({
        id: 'birthDate',
        text: '언제 이 세상에 태어났는가?\n별과 사주, 모두 이 날짜에서 시작된다네.',
        type: 'date',
        required: true,
      });

      questions.push({
        id: 'calendarType',
        text: '양력인가, 음력인가?',
        type: 'select',
        required: true,
        options: [
          { value: 'solar', label: '양력' },
          { value: 'lunar', label: '음력' },
        ],
      });

      questions.push({
        id: 'bloodType',
        text: '그대의 혈액형은?\n피에는 성격의 비밀이 흐른다네.',
        type: 'select',
        required: true,
        options: [
          { value: 'A', label: 'A형' },
          { value: 'B', label: 'B형' },
          { value: 'O', label: 'O형' },
          { value: 'AB', label: 'AB형' },
        ],
      });

      questions.push({
        id: 'mbti',
        text: '그대의 MBTI 유형은?\n마음의 지도를 그려보세.',
        type: 'text',
        required: true,
        placeholder: '예: INFP',
      });

      return questions;
    }

    // === 기존 개별 분석 모드 ===

    // 관상: 사진 업로드 (최우선)
    if (mode === 'face') {
      questions.push({
        id: 'faceImage',
        text: '그대의 얼굴을 보여주시게.\n관상에는 운명이 새겨져 있다네.',
        type: 'file',
        required: true,
      });
    }

    // 이름 (모든 모드에서 수집)
    questions.push({
      id: 'name',
      text: '이름을 알려주시게.\n이름은 영혼의 첫 번째 진동이니.',
      type: 'text',
      required: true,
      placeholder: '예: 홍길동',
    });

    // 생년월일 (MBTI, 혈액형 제외)
    if (mode !== 'mbti' && mode !== 'blood') {
      questions.push({
        id: 'birthDate',
        text: '언제 이 세상에 태어났는가?\n별들의 배치가 운명을 결정한다네.',
        type: 'date',
        required: true,
      });

      questions.push({
        id: 'calendarType',
        text: '양력인가, 음력인가?',
        type: 'select',
        required: true,
        options: [
          { value: 'solar', label: '양력' },
          { value: 'lunar', label: '음력' },
        ],
      });
    }

    // 점성학: 태어난 시간/장소 (선택)
    if (mode === 'zodiac') {
      questions.push({
        id: 'birthTime',
        text: '출생 시각을 알고 있다면 알려주게.\n하늘의 시계가 그대의 별자리를 가리킨다.',
        type: 'time',
        required: false,
      });

      questions.push({
        id: 'birthPlace',
        text: '어디서 태어났는가?',
        type: 'text',
        required: false,
        placeholder: '예: 서울특별시',
      });
    }

    // 혈액형 (관련 모드 + 통합)
    if (mode === 'blood' || mode === 'face' || mode === 'saju' || mode === 'zodiac' || mode === 'integrated') {
      const isRequired = mode === 'blood';
      questions.push({
        id: 'bloodType',
        text: isRequired
          ? '그대의 혈액형은 무엇인가?\n피에는 성격의 비밀이 흐른다네.'
          : '혈액형을 알고 있다면 알려주게.',
        type: 'select',
        required: isRequired,
        options: isRequired
          ? [
              { value: 'A', label: 'A형' },
              { value: 'B', label: 'B형' },
              { value: 'O', label: 'O형' },
              { value: 'AB', label: 'AB형' },
            ]
          : [
              { value: '', label: '모르겠음' },
              { value: 'A', label: 'A형' },
              { value: 'B', label: 'B형' },
              { value: 'O', label: 'O형' },
              { value: 'AB', label: 'AB형' },
            ],
      });
    }

    // MBTI (관련 모드 + 통합)
    if (mode === 'mbti' || mode === 'face' || mode === 'saju' || mode === 'zodiac' || mode === 'integrated') {
      questions.push({
        id: 'mbti',
        text: mode === 'mbti'
          ? '그대의 MBTI 유형은 무엇인가?\n4글자로 그대의 마음을 밝혀보게.'
          : 'MBTI를 안다면 알려주게.',
        type: 'text',
        required: mode === 'mbti',
        placeholder: '예: INFP',
      });
    }

    // 커플 궁합: 파트너 정보
    if (mode === 'couple') {
      questions.push({
        id: 'partnerName',
        text: '상대방의 이름을 알려주시게.\n인연의 실을 따라가 보자꾸나.',
        type: 'text',
        required: true,
        placeholder: '상대방 이름',
      });

      questions.push({
        id: 'partnerBirthDate',
        text: '상대방은 언제 태어났는가?',
        type: 'date',
        required: true,
      });

      questions.push({
        id: 'partnerCalendarType',
        text: '상대방의 생년월일은 양력인가, 음력인가?',
        type: 'select',
        required: true,
        options: [
          { value: 'solar', label: '양력' },
          { value: 'lunar', label: '음력' },
        ],
      });

      questions.push({
        id: 'partnerBloodType',
        text: '상대방의 혈액형을 아는가?',
        type: 'select',
        required: false,
        options: [
          { value: '', label: '모르겠음' },
          { value: 'A', label: 'A형' },
          { value: 'B', label: 'B형' },
          { value: 'O', label: 'O형' },
          { value: 'AB', label: 'AB형' },
        ],
      });

      questions.push({
        id: 'partnerMbti',
        text: '상대방의 MBTI를 안다면 알려주게.',
        type: 'text',
        required: false,
        placeholder: '예: ENFJ',
      });
    }

    return questions;
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  // 다음 단계
  const handleNext = async () => {
    if (!currentValue && currentQuestion.required) return;

    // 관상 분석: 사진 업로드 후 AI 분석 호출
    if (currentQuestion.id === 'faceImage' && imagePreview) {
      setIsAnalyzing(true);
      try {
        const features = await analyzeFace(imagePreview);
        const parts: string[] = [];
        if (features.faceShape) parts.push(`얼굴형: ${features.faceShape}`);
        if (features.samjeong) {
          parts.push(`삼정 - 상정: ${features.samjeong.upper}, 중정: ${features.samjeong.middle}, 하정: ${features.samjeong.lower}`);
        }
        if (features.eyes) parts.push(`눈: ${features.eyes}`);
        if (features.eyebrows) parts.push(`눈썹: ${features.eyebrows}`);
        if (features.nose) parts.push(`코: ${features.nose}`);
        if (features.mouth) parts.push(`입: ${features.mouth}`);
        if (features.ears) parts.push(`귀: ${features.ears}`);
        if (features.forehead) parts.push(`이마: ${features.forehead}`);
        if (features.chin) parts.push(`턱: ${features.chin}`);
        if (features.impression) parts.push(`종합 인상: ${features.impression}`);
        const featuresText = parts.join(' / ');
        onChange({ faceFeatures: featuresText });
      } catch (error: any) {
        setIsAnalyzing(false);
        showToast('error', error.message || '관상 분석에 실패했습니다. 다른 사진을 시도해주세요.');
        return; // 실패 시 진행하지 않음
      }
      setIsAnalyzing(false);

      // faceImage는 handleImageUpload에서 이미 설정됨 → 'uploaded'로 덮어쓰지 않음
      if (isLastStep) {
        onSubmit(profile);
      } else {
        setCurrentStep(currentStep + 1);
        setCurrentValue('');
      }
      return;
    }

    const updatedProfile = mapToProfile(currentQuestion.id, currentValue);
    onChange(updatedProfile);

    if (isLastStep) {
      onSubmit({ ...profile, ...updatedProfile });
    } else {
      setCurrentStep(currentStep + 1);
      setCurrentValue('');
    }
  };

  // Enter 키로 다음 단계
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  // select 옵션 클릭
  const handleSelectOption = (optionValue: string) => {
    // 필수 항목인데 빈 값이면 무시
    if (!optionValue && currentQuestion.required) return;

    setCurrentValue(optionValue);
    setTimeout(() => {
      const updatedProfile = mapToProfile(currentQuestion.id, optionValue);
      onChange(updatedProfile);
      if (isLastStep) {
        onSubmit({ ...profile, ...updatedProfile });
      } else {
        setCurrentStep(currentStep + 1);
        setCurrentValue('');
      }
    }, 200);
  };

  // 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      onChange({ faceImage: base64 });
      setCurrentValue('uploaded');
    };
    reader.readAsDataURL(file);
  };

  // 자동 포커스
  useEffect(() => {
    const input = document.getElementById('conversation-input');
    if (input) {
      input.focus();
    }
  }, [currentStep]);

  // === 재방문 사용자 환영 카드 ===
  if (showReturningCard && savedProfile) {
    const profileItems = [
      savedProfile.name && { label: '이름', value: savedProfile.name },
      savedProfile.birthDate && { label: '생년월일', value: savedProfile.birthDate },
      savedProfile.bloodType && { label: '혈액형', value: `${savedProfile.bloodType}형` },
      savedProfile.mbti && { label: 'MBTI', value: savedProfile.mbti },
      savedProfile.gender && { label: '성별', value: savedProfile.gender === 'male' ? '남성' : '여성' },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
      <div className="w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-8 rounded-2xl text-center space-y-6"
        >
          {/* 아이콘 */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-nebula-500/15 border border-nebula-500/30 mx-auto">
            <UserCheck className="w-8 h-8 text-nebula-400" />
          </div>

          {/* 인사 */}
          <div>
            <h2 className="text-2xl font-serif font-bold text-starlight-200 mb-2">
              어서 오시게, {savedProfile.name}님!
            </h2>
            <p className="text-sm text-starlight-400/70">
              이전에 입력하신 정보가 있습니다
            </p>
          </div>

          {/* 프로필 요약 */}
          <div className="bg-cosmic-800/50 rounded-xl p-4 space-y-2">
            {profileItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-starlight-400/60">{item.label}</span>
                <span className="text-starlight-200 font-medium">{item.value}</span>
              </div>
            ))}
          </div>

          {/* 메인 CTA */}
          <motion.button
            onClick={() => onSubmit(savedProfile)}
            className="w-full px-6 py-4 rounded-xl nebula-gradient text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5" />
            이 정보로 상담 시작
          </motion.button>

          {/* 보조 액션 */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <button
              onClick={() => {
                // localStorage 프로필 삭제 + 빈 폼
                localStorage.removeItem('vibeProfile');
                setSavedProfile(null);
                setShowReturningCard(false);
              }}
              className="text-starlight-400/60 hover:text-starlight-300 transition-colors"
            >
              다른 사람이에요
            </button>
            <span className="text-cosmic-700">|</span>
            <button
              onClick={() => {
                // 기존 값 채워서 폼으로 전환
                onChange(savedProfile);
                setShowReturningCard(false);
              }}
              className="text-nebula-400/80 hover:text-nebula-300 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              정보 수정하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-2xl mx-auto px-4"
      role="form"
      aria-labelledby="form-question"
    >
      {/* 진행률 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm text-starlight-400/70"
            aria-live="polite"
            aria-atomic="true"
          >
            {currentStep + 1} / {questions.length}
          </span>
          <button
            onClick={onCancel}
            className="text-sm text-starlight-400/70 hover:text-starlight-300 transition-colors"
            aria-label="처음으로 돌아가기"
          >
            처음으로
          </button>
        </div>
        <div
          className="h-1 bg-cosmic-800 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={((currentStep + 1) / questions.length) * 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="입력 진행률"
        >
          <div
            className="h-full nebula-gradient transition-all duration-500"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 질문 */}
      <div className="mb-12 animate-fade-in">
        <h2
          id="form-question"
          className="text-2xl md:text-3xl font-serif text-starlight-200 leading-relaxed whitespace-pre-line"
        >
          {currentQuestion.text}
        </h2>
      </div>

      {/* 입력 */}
      <div className="space-y-6">
        {currentQuestion.type === 'file' ? (
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="conversation-input"
              aria-required={currentQuestion.required}
              aria-label="얼굴 사진 업로드"
            />
            <label
              htmlFor="conversation-input"
              className="block w-full h-64 border-2 border-dashed border-nebula-400/30 rounded-2xl cursor-pointer hover:border-nebula-400/50 transition-colors flex items-center justify-center overflow-hidden group"
              aria-label="사진 업로드 영역"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-nebula-400/50 group-hover:text-nebula-400/70 transition-colors" />
                  <p className="text-starlight-300">사진을 선택하세요</p>
                </div>
              )}
            </label>
            {imagePreview && (
              <button
                onClick={handleNext}
                disabled={isAnalyzing}
                className="w-full px-6 py-4 rounded-xl nebula-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    관상을 읽는 중...
                  </>
                ) : (
                  <>
                    다음 <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : currentQuestion.type === 'select' ? (
          <div className="space-y-3" role="radiogroup" aria-required={currentQuestion.required}>
            {currentQuestion.options?.map((option, index) => (
              <motion.button
                key={option.value || '__empty__'}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                role="radio"
                aria-checked={currentValue === option.value}
                onClick={() => handleSelectOption(option.value)}
                className={`w-full px-6 py-4 rounded-xl border text-starlight-200 hover:bg-nebula-500/10 hover:border-nebula-400/50 transition-all text-left font-medium ${
                  !option.value ? 'border-cosmic-700/50 text-starlight-400/60' : 'border-nebula-400/30'
                }`}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        ) : currentQuestion.type === 'date' ? (
          <>
            <AceternityDateSelector
              value={currentValue}
              onChange={(date) => setCurrentValue(date)}
              placeholder="날짜를 선택하세요"
            />
            <motion.button
              onClick={handleNext}
              disabled={!currentValue && currentQuestion.required}
              className="w-full px-6 py-4 rounded-xl nebula-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLastStep ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  운명의 문을 열다
                </>
              ) : (
                <>
                  다음 <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </>
        ) : (
          <>
            <AceternityInput
              id="conversation-input"
              type={currentQuestion.type}
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={currentQuestion.placeholder}
              className="text-lg"
              autoComplete="off"
              aria-required={currentQuestion.required}
            />
            <motion.button
              onClick={handleNext}
              disabled={!currentValue && currentQuestion.required}
              className="w-full px-6 py-4 rounded-xl nebula-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLastStep ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  운명의 문을 열다
                </>
              ) : (
                <>
                  다음 <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </>
        )}
      </div>

      {/* 건너뛰기 (선택 항목만, select가 아닌 경우) */}
      {!currentQuestion.required && currentQuestion.type !== 'select' && (
        <button
          onClick={() => {
            if (isLastStep) {
              onSubmit(profile);
            } else {
              setCurrentStep(currentStep + 1);
              setCurrentValue('');
            }
          }}
          className="w-full mt-4 text-sm text-starlight-400/70 hover:text-starlight-300 transition-colors"
        >
          건너뛰기
        </button>
      )}
    </div>
  );
}
