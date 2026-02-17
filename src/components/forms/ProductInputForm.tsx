import React, { useState } from 'react';
import { UserProfile, AnalysisMode, CalendarType } from '../../types';
import { Sparkles, Upload, Calendar, Clock, MapPin, Droplet, Brain } from 'lucide-react';

interface ProductInputFormProps {
  mode: AnalysisMode;
  onSubmit: (profile: Partial<UserProfile>) => void;
  onCancel: () => void;
}

export default function ProductInputForm({ mode, onSubmit, onCancel }: ProductInputFormProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    birthDate: '',
    calendarType: 'solar',
    birthTime: '',
    birthPlace: '',
    bloodType: '',
    mbti: '',
    gender: 'other',
  });

  const [imagePreview, setImagePreview] = useState<string>('');

  // 이미지 업로드 핸들러 (관상 분석용)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData({ ...formData, faceImage: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // 모드별 제목
  const getTitleByMode = () => {
    switch (mode) {
      case 'face': return '관상 분석';
      case 'saju': return '사주명리 운세';
      case 'zodiac': return '점성학 분석';
      case 'mbti': return 'MBTI 인지구조';
      case 'blood': return '혈액형 심리';
      case 'couple': return '커플 궁합';
      default: return '통합 심층분석';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="glass-panel p-8 rounded-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-starlight-200 mb-2 font-serif">
            {getTitleByMode()}
          </h2>
          <p className="text-sm text-starlight-400/70">
            필요한 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 관상: 사진 업로드 */}
          {mode === 'face' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-starlight-300">
                <Upload className="w-4 h-4 inline mr-2" />
                얼굴 사진 업로드
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="face-upload"
                />
                <label
                  htmlFor="face-upload"
                  className="block w-full h-48 border-2 border-dashed border-nebula-400/30 rounded-xl cursor-pointer hover:border-nebula-400/50 transition-colors flex items-center justify-center overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 mx-auto mb-2 text-nebula-400/50" />
                      <p className="text-sm text-starlight-400/70">클릭하여 사진 업로드</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* 이름 (MBTI, 혈액형 제외) */}
          {mode !== 'mbti' && mode !== 'blood' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-starlight-300">
                이름
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl"
                placeholder="이름을 입력하세요"
                required
              />
            </div>
          )}

          {/* 생년월일 + 양력/음력 (MBTI, 혈액형 제외) */}
          {mode !== 'mbti' && mode !== 'blood' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-starlight-300">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  생년월일
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-starlight-300">
                  음력/양력
                </label>
                <select
                  value={formData.calendarType}
                  onChange={(e) => setFormData({ ...formData, calendarType: e.target.value as CalendarType })}
                  className="glass-input w-full px-4 py-3 rounded-xl"
                >
                  <option value="solar">양력</option>
                  <option value="lunar">음력</option>
                </select>
              </div>
            </div>
          )}

          {/* 태어난 시간 (점성학만) */}
          {mode === 'zodiac' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-starlight-300">
                <Clock className="w-4 h-4 inline mr-2" />
                태어난 시간
              </label>
              <input
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl"
                required
              />
            </div>
          )}

          {/* 태어난 지역 (점성학만) */}
          {mode === 'zodiac' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-starlight-300">
                <MapPin className="w-4 h-4 inline mr-2" />
                태어난 지역
              </label>
              <input
                type="text"
                value={formData.birthPlace}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl"
                placeholder="예: 서울특별시"
                required
              />
            </div>
          )}

          {/* 혈액형 */}
          {(mode === 'blood' || mode === 'face' || mode === 'saju' || mode === 'zodiac') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-starlight-300">
                <Droplet className="w-4 h-4 inline mr-2" />
                혈액형 {mode !== 'blood' && <span className="text-xs text-starlight-400/50">(선택)</span>}
              </label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl"
                required={mode === 'blood'}
              >
                <option value="">선택하세요</option>
                <option value="A">A형</option>
                <option value="B">B형</option>
                <option value="O">O형</option>
                <option value="AB">AB형</option>
              </select>
            </div>
          )}

          {/* MBTI */}
          {(mode === 'mbti' || mode === 'face' || mode === 'saju' || mode === 'zodiac') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-starlight-300">
                <Brain className="w-4 h-4 inline mr-2" />
                MBTI {mode !== 'mbti' && <span className="text-xs text-starlight-400/50">(선택)</span>}
              </label>
              <input
                type="text"
                value={formData.mbti}
                onChange={(e) => setFormData({ ...formData, mbti: e.target.value.toUpperCase() })}
                className="glass-input w-full px-4 py-3 rounded-xl"
                placeholder="예: INFP"
                maxLength={4}
                required={mode === 'mbti'}
              />
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-xl border border-cosmic-700 text-starlight-300 hover:bg-cosmic-800/50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl nebula-gradient text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              분석 시작
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
