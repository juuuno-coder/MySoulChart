import React from 'react';
import { UserProfile, AnalysisMode } from '../../types';
import { User, Calendar, Clock, MapPin, Droplet, Brain, Sparkles } from 'lucide-react';

interface InputSidebarProps {
  mode: AnalysisMode;
  profile: Partial<UserProfile>;
  completedAnalyses?: number; // 완료된 분석 개수 (0-5)
}

export default function InputSidebar({ mode, profile, completedAnalyses = 0 }: InputSidebarProps) {
  // 모드별 제목
  const getTitle = () => {
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

  // 모드별 설명
  const getDescription = () => {
    switch (mode) {
      case 'face': return '얼굴에 새겨진 운명의 흔적을 읽어내는 고대의 지혜입니다.';
      case 'saju': return '하늘이 정한 사주팔자로 인생의 길을 밝히는 동양 철학입니다.';
      case 'zodiac': return '별들의 배치가 말하는 당신의 운명과 성격을 탐구합니다.';
      case 'mbti': return '16가지 성격 유형으로 마음의 구조를 파악합니다.';
      case 'blood': return '혈액형에 담긴 성격의 비밀을 풀어냅니다.';
      case 'couple': return '두 영혼의 궁합과 운명적 연결을 분석합니다.';
      default: return '모든 분석을 통합하여 영혼의 전체상을 그려냅니다.';
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      {/* 입력된 프로필 미리보기 */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-nebula-400" />
          <h3 className="font-serif text-lg font-bold text-starlight-200">
            입력 현황
          </h3>
        </div>

        <div className="space-y-3 text-sm">
          {/* 이미지 미리보기 */}
          {profile.faceImage && (
            <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border-2 border-nebula-400/30">
              <img
                src={profile.faceImage}
                alt="Face"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 이름 */}
          {profile.name && (
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-nebula-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-starlight-400/70 mb-1">이름</p>
                <p className="text-starlight-200 font-medium">{profile.name}</p>
              </div>
            </div>
          )}

          {/* 생년월일 */}
          {profile.birthDate && (
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-nebula-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-starlight-400/70 mb-1">
                  생년월일 ({profile.calendarType === 'solar' ? '양력' : '음력'})
                </p>
                <p className="text-starlight-200 font-medium">{profile.birthDate}</p>
              </div>
            </div>
          )}

          {/* 태어난 시간 */}
          {profile.birthTime && (
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-nebula-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-starlight-400/70 mb-1">태어난 시간</p>
                <p className="text-starlight-200 font-medium">{profile.birthTime}</p>
              </div>
            </div>
          )}

          {/* 태어난 지역 */}
          {profile.birthPlace && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-nebula-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-starlight-400/70 mb-1">태어난 지역</p>
                <p className="text-starlight-200 font-medium">{profile.birthPlace}</p>
              </div>
            </div>
          )}

          {/* 혈액형 */}
          {profile.bloodType && (
            <div className="flex items-start gap-3">
              <Droplet className="w-4 h-4 text-nebula-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-starlight-400/70 mb-1">혈액형</p>
                <p className="text-starlight-200 font-medium">{profile.bloodType}형</p>
              </div>
            </div>
          )}

          {/* MBTI */}
          {profile.mbti && (
            <div className="flex items-start gap-3">
              <Brain className="w-4 h-4 text-nebula-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-starlight-400/70 mb-1">MBTI</p>
                <p className="text-starlight-200 font-medium">{profile.mbti}</p>
              </div>
            </div>
          )}

          {/* 아직 입력 전 */}
          {!profile.name && !profile.birthDate && !profile.bloodType && !profile.mbti && !profile.faceImage && (
            <p className="text-starlight-400/50 text-center py-8">
              입력을 시작하면<br />여기에 표시됩니다
            </p>
          )}
        </div>
      </div>

      {/* 분석 설명 */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-aurora-400" />
          <h3 className="font-serif text-lg font-bold text-starlight-200">
            {getTitle()}
          </h3>
        </div>
        <p className="text-sm text-starlight-300/80 leading-relaxed">
          {getDescription()}
        </p>
      </div>

      {/* 소울 차트 진행률 */}
      <div className="glass-panel p-6 rounded-2xl flex-1">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-nebula-400 star-twinkle" />
          <h3 className="font-serif text-lg font-bold text-starlight-200">
            Soul Chart
          </h3>
        </div>

        {/* 원형 진행률 */}
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            {/* 배경 원 */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="rgba(139, 92, 246, 0.1)"
              strokeWidth="8"
            />
            {/* 진행률 원 */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeDasharray={`${(completedAnalyses / 5) * 440} 440`}
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
            <p className="text-4xl font-bold text-starlight-200">{completedAnalyses}</p>
            <p className="text-sm text-starlight-400/70">/ 5</p>
          </div>
        </div>

        {/* 5가지 분석 목록 */}
        <div className="space-y-2 text-xs">
          {['관상', '사주', '점성학', 'MBTI', '혈액형'].map((name, index) => (
            <div
              key={name}
              className="flex items-center gap-2 text-starlight-300/70"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  index < completedAnalyses ? 'bg-nebula-400' : 'bg-cosmic-700'
                }`}
              />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
