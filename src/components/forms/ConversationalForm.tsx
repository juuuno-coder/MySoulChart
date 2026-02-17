import React, { useState, useEffect } from 'react';
import { UserProfile, AnalysisMode, CalendarType } from '../../types';
import { Sparkles, ArrowRight, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { AceternityInput } from '../ui/AceternityInput';
import AceternityDateSelector from '../ui/AceternityDateSelector';

interface ConversationalFormProps {
  mode: AnalysisMode;
  profile: UserProfile; // 추가: profile props
  onSubmit: (profile: Partial<UserProfile>) => void;
  onCancel: () => void;
  onChange: (profile: Partial<UserProfile>) => void; // 실시간 업데이트 (required로 변경)
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'date' | 'select' | 'time' | 'file';
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export default function ConversationalForm({ mode, profile, onSubmit, onCancel, onChange }: ConversationalFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [currentValue, setCurrentValue] = useState('');

  // 모드별 질문 구성
  const getQuestions = (): Question[] => {
    const baseQuestions: Question[] = [];

    // 관상: 사진 업로드
    if (mode === 'face') {
      baseQuestions.push({
        id: 'faceImage',
        text: '그대의 얼굴을 보여주시게.\n관상에는 운명이 새겨져 있다네.',
        type: 'file',
        required: true,
      });
    }

    // 이름 (MBTI, 혈액형 제외)
    if (mode !== 'mbti' && mode !== 'blood') {
      baseQuestions.push({
        id: 'name',
        text: '이름을 알려주시게.\n이름은 영혼의 첫 번째 진동이니.',
        type: 'text',
        required: true,
        placeholder: '예: 홍길동',
      });
    }

    // 생년월일 (MBTI, 혈액형 제외)
    if (mode !== 'mbti' && mode !== 'blood') {
      baseQuestions.push({
        id: 'birthDate',
        text: '언제 이 세상에 태어났는가?\n별들의 배치가 운명을 결정한다네.',
        type: 'date',
        required: true,
      });

      baseQuestions.push({
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

    // 태어난 시간 (별자리만)
    if (mode === 'zodiac') {
      baseQuestions.push({
        id: 'birthTime',
        text: '정확한 출생 시각을 알려주게.\n하늘의 시계가 그대의 별자리를 가리킨다.',
        type: 'time',
        required: true,
      });

      baseQuestions.push({
        id: 'birthPlace',
        text: '어디서 태어났는가?\n장소도 운명의 일부라네.',
        type: 'text',
        required: true,
        placeholder: '예: 서울특별시',
      });
    }

    // 혈액형
    if (mode === 'blood' || mode === 'face' || mode === 'saju' || mode === 'zodiac') {
      baseQuestions.push({
        id: 'bloodType',
        text: mode === 'blood'
          ? '그대의 혈액형은 무엇인가?\n피에는 성격의 비밀이 흐른다네.'
          : '혈액형을 알고 있다면 알려주게. (선택)',
        type: 'select',
        required: mode === 'blood',
        options: [
          { value: '', label: '선택하세요' },
          { value: 'A', label: 'A형' },
          { value: 'B', label: 'B형' },
          { value: 'O', label: 'O형' },
          { value: 'AB', label: 'AB형' },
        ],
      });
    }

    // MBTI
    if (mode === 'mbti' || mode === 'face' || mode === 'saju' || mode === 'zodiac') {
      baseQuestions.push({
        id: 'mbti',
        text: mode === 'mbti'
          ? '그대의 MBTI 유형은 무엇인가?\n4글자로 그대의 마음을 밝혀보게.'
          : 'MBTI를 안다면 알려주게. (선택)',
        type: 'text',
        required: mode === 'mbti',
        placeholder: '예: INFP',
      });
    }

    return baseQuestions;
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  // 다음 단계
  const handleNext = () => {
    if (!currentValue && currentQuestion.required) return;

    // 데이터 저장
    const updatedProfile = {
      [currentQuestion.id]: currentValue,
    };

    // 실시간 업데이트
    onChange(updatedProfile);

    if (isLastStep) {
      // 제출
      onSubmit({ ...profile, ...updatedProfile });
    } else {
      // 다음 질문
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
                className="w-full px-6 py-4 rounded-xl nebula-gradient text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                다음 <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : currentQuestion.type === 'select' ? (
          <div className="space-y-3" role="radiogroup" aria-required={currentQuestion.required}>
            {currentQuestion.options?.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                role="radio"
                aria-checked={currentValue === option.value}
                onClick={() => {
                  setCurrentValue(option.value);
                  setTimeout(() => {
                    const updatedProfile = { [currentQuestion.id]: option.value };
                    onChange(updatedProfile);
                    if (isLastStep) {
                      onSubmit({ ...profile, ...updatedProfile });
                    } else {
                      setCurrentStep(currentStep + 1);
                      setCurrentValue('');
                    }
                  }, 200);
                }}
                className="w-full px-6 py-4 rounded-xl border border-nebula-400/30 text-starlight-200 hover:bg-nebula-500/10 hover:border-nebula-400/50 transition-all text-left font-medium"
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

      {/* 건너뛰기 (선택 항목만) */}
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
