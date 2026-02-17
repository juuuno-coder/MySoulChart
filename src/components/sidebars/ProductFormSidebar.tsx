import React from 'react';
import { UserProfile, AnalysisMode, PersonData } from '../../types';
import { User, Calendar, Clock, MapPin, Droplet, Brain, Upload, Sparkles, Heart } from 'lucide-react';
import DatePicker from '../inputs/DatePicker';
import { getZodiacFromDate, ZODIAC_DATA } from '../../constants/zodiac';

interface ProductFormSidebarProps {
  mode: AnalysisMode;
  profile: Partial<UserProfile>;
  onChange: (profile: Partial<UserProfile>) => void;
  completedAnalyses?: number;
}

export default function ProductFormSidebar({ mode, profile, onChange, completedAnalyses = 0 }: ProductFormSidebarProps) {
  const handleChange = (field: keyof UserProfile, value: any) => {
    // 생년월일 변경 시 별자리 자동 계산
    if (field === 'birthDate' && value) {
      const zodiacSign = getZodiacFromDate(value);
      onChange({
        [field]: value,
        ...(zodiacSign && { zodiacSign })
      });
    } else {
      onChange({ [field]: value });
    }
  };

  const handlePartnerChange = (field: keyof PersonData, value: any) => {
    onChange({
      partner: {
        ...(profile.partner || { name: '', birthDate: '', calendarType: 'solar', birthTime: '', birthPlace: '', bloodType: '', mbti: '', gender: 'other' }),
        [field]: value,
      } as PersonData,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('faceImage', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 혈액형 버튼 그리드 공통 컴포넌트
  const BloodTypeGrid = ({ value, onSelect }: { value: string; onSelect: (v: string) => void }) => (
    <div className="grid grid-cols-4 gap-2">
      {['A', 'B', 'O', 'AB'].map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`px-3 py-2 rounded-xl border transition-all text-sm ${
            value === type
              ? 'border-nebula-400 bg-nebula-500/20 text-nebula-200'
              : 'border-cosmic-700 text-starlight-400/70 hover:border-cosmic-600'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );

  // 양력/음력 토글 공통 컴포넌트
  const CalendarToggle = ({ value, onSelect }: { value: string; onSelect: (v: string) => void }) => (
    <div className="grid grid-cols-2 gap-2">
      {[{ v: 'solar', l: '양력' }, { v: 'lunar', l: '음력' }].map(({ v, l }) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={`px-4 py-2 rounded-xl border transition-all ${
            value === v
              ? 'border-nebula-400 bg-nebula-500/20 text-nebula-200'
              : 'border-cosmic-700 text-starlight-400/70 hover:border-cosmic-600'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-screen overflow-y-auto p-6 space-y-6 bg-cosmic-900/30">
      {/* 상품 타이틀 */}
      <div className="glass-panel p-4 rounded-2xl">
        <h3 className="font-serif text-xl font-bold text-starlight-200 text-center">
          {mode === 'face' && '관상 분석'}
          {mode === 'saju' && '사주명리 운세'}
          {mode === 'zodiac' && '점성학 분석'}
          {mode === 'mbti' && 'MBTI 인지구조'}
          {mode === 'blood' && '혈액형 심리'}
          {mode === 'couple' && '커플 궁합'}
          {mode === 'integrated' && '통합 심층분석'}
        </h3>
      </div>

      {/* 본인 정보 입력 */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-nebula-400" />
          <h4 className="font-bold text-starlight-200">
            {mode === 'couple' ? '본인 정보' : '정보 입력'}
          </h4>
        </div>

        {/* 관상: 사진 업로드 */}
        {mode === 'face' && (
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <Upload className="w-4 h-4 inline mr-2" />
              얼굴 사진
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="sidebar-face-upload"
            />
            <label
              htmlFor="sidebar-face-upload"
              className="block w-full h-40 border-2 border-dashed border-nebula-400/30 rounded-xl cursor-pointer hover:border-nebula-400/50 transition-colors flex items-center justify-center overflow-hidden"
            >
              {profile.faceImage ? (
                <img src={profile.faceImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-nebula-400/50" />
                  <p className="text-xs text-starlight-400/70">사진 선택</p>
                </div>
              )}
            </label>
          </div>
        )}

        {/* 이름 (모든 모드) */}
        <div className="space-y-2">
          <label className="block text-sm text-starlight-300">
            <User className="w-4 h-4 inline mr-2" />
            이름
          </label>
          <input
            type="text"
            value={profile.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="glass-input w-full px-4 py-2 rounded-xl text-sm"
            placeholder="이름 입력"
          />
        </div>

        {/* 생년월일 (MBTI, 혈액형 제외) */}
        {mode !== 'mbti' && mode !== 'blood' && (
          <>
            <div className="space-y-2">
              <label className="block text-sm text-starlight-300">
                <Calendar className="w-4 h-4 inline mr-2" />
                생년월일
              </label>
              <DatePicker
                value={profile.birthDate || ''}
                onChange={(date) => handleChange('birthDate', date)}
              />
              {/* 별자리 자동 표시 */}
              {profile.zodiacSign && ZODIAC_DATA[profile.zodiacSign] && (
                <div className="mt-2 flex items-center gap-2 text-xs text-nebula-300 bg-nebula-500/10 rounded-lg px-3 py-2 border border-nebula-500/20">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {ZODIAC_DATA[profile.zodiacSign].symbol} {ZODIAC_DATA[profile.zodiacSign].name}
                    <span className="text-starlight-400/60 ml-1">
                      ({ZODIAC_DATA[profile.zodiacSign].element})
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-starlight-300">음력/양력</label>
              <CalendarToggle
                value={profile.calendarType || 'solar'}
                onSelect={(v) => handleChange('calendarType', v)}
              />
            </div>
          </>
        )}

        {/* 점성학: 태어난 시간 */}
        {mode === 'zodiac' && (
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <Clock className="w-4 h-4 inline mr-2" />
              태어난 시간 <span className="text-xs opacity-50">(선택)</span>
            </label>
            <input
              type="time"
              value={profile.birthTime || ''}
              onChange={(e) => handleChange('birthTime', e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-xl text-sm"
            />
          </div>
        )}

        {/* 점성학: 태어난 지역 */}
        {mode === 'zodiac' && (
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <MapPin className="w-4 h-4 inline mr-2" />
              태어난 지역 <span className="text-xs opacity-50">(선택)</span>
            </label>
            <input
              type="text"
              value={profile.birthPlace || ''}
              onChange={(e) => handleChange('birthPlace', e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-xl text-sm"
              placeholder="예: 서울특별시"
            />
          </div>
        )}

        {/* 혈액형 */}
        {(mode === 'blood' || mode === 'face' || mode === 'saju' || mode === 'zodiac' || mode === 'integrated') && (
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <Droplet className="w-4 h-4 inline mr-2" />
              혈액형 {mode !== 'blood' && <span className="text-xs opacity-50">(선택)</span>}
            </label>
            <BloodTypeGrid
              value={profile.bloodType || ''}
              onSelect={(v) => handleChange('bloodType', v)}
            />
          </div>
        )}

        {/* MBTI */}
        {(mode === 'mbti' || mode === 'face' || mode === 'saju' || mode === 'zodiac' || mode === 'integrated') && (
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <Brain className="w-4 h-4 inline mr-2" />
              MBTI {mode !== 'mbti' && <span className="text-xs opacity-50">(선택)</span>}
            </label>
            <input
              type="text"
              value={profile.mbti || ''}
              onChange={(e) => handleChange('mbti', e.target.value.toUpperCase())}
              className="glass-input w-full px-4 py-2 rounded-xl text-sm text-center"
              placeholder="예: INFP"
              maxLength={4}
            />
          </div>
        )}
      </div>

      {/* 커플 궁합: 파트너 정보 */}
      {mode === 'couple' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-pink-400" />
            <h4 className="font-bold text-starlight-200">상대방 정보</h4>
          </div>

          {/* 파트너 이름 */}
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <User className="w-4 h-4 inline mr-2" />
              이름
            </label>
            <input
              type="text"
              value={profile.partner?.name || ''}
              onChange={(e) => handlePartnerChange('name', e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-xl text-sm"
              placeholder="상대방 이름"
            />
          </div>

          {/* 파트너 생년월일 */}
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <Calendar className="w-4 h-4 inline mr-2" />
              생년월일
            </label>
            <DatePicker
              value={profile.partner?.birthDate || ''}
              onChange={(date) => handlePartnerChange('birthDate', date)}
            />
          </div>

          {/* 파트너 음력/양력 */}
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">음력/양력</label>
            <CalendarToggle
              value={profile.partner?.calendarType || 'solar'}
              onSelect={(v) => handlePartnerChange('calendarType', v)}
            />
          </div>

          {/* 파트너 혈액형 (선택) */}
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <Droplet className="w-4 h-4 inline mr-2" />
              혈액형 <span className="text-xs opacity-50">(선택)</span>
            </label>
            <BloodTypeGrid
              value={profile.partner?.bloodType || ''}
              onSelect={(v) => handlePartnerChange('bloodType', v)}
            />
          </div>

          {/* 파트너 MBTI (선택) */}
          <div className="space-y-2">
            <label className="block text-sm text-starlight-300">
              <Brain className="w-4 h-4 inline mr-2" />
              MBTI <span className="text-xs opacity-50">(선택)</span>
            </label>
            <input
              type="text"
              value={profile.partner?.mbti || ''}
              onChange={(e) => handlePartnerChange('mbti', e.target.value.toUpperCase())}
              className="glass-input w-full px-4 py-2 rounded-xl text-sm text-center"
              placeholder="예: ENFJ"
              maxLength={4}
            />
          </div>
        </div>
      )}

      {/* Soul Chart 진행률 */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-nebula-400 star-twinkle" />
          <h4 className="font-bold text-starlight-200">Soul Chart</h4>
        </div>

        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="8" />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeDasharray={`${(completedAnalyses / 5) * 352} 352`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-starlight-200">{completedAnalyses}</p>
            <p className="text-xs text-starlight-400/70">/ 5</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {['관상', '사주', '점성학', 'MBTI', '혈액형'].map((name, index) => (
            <div key={name} className="flex items-center gap-2 text-starlight-300/70">
              <div className={`w-2 h-2 rounded-full ${index < completedAnalyses ? 'bg-nebula-400' : 'bg-cosmic-700'}`} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
