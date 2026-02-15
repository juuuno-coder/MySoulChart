import React from 'react';
import { AnalysisMode } from '../../types';
import { ScrollText, Dna, Activity, ScanFace, Brain, Heart, Star } from 'lucide-react';

interface ModeSelectorProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange }) => {
  const modes: { id: AnalysisMode; icon: typeof Brain; label: string; desc: string }[] = [
    { id: 'integrated', icon: Brain, label: '통합 점사', desc: '모든 데이터를 종합' },
    { id: 'zodiac', icon: Star, label: '별자리', desc: '서양 점성술 운세' },
    { id: 'blood', icon: Dna, label: '혈액형', desc: '성격 심리 분석' },
    { id: 'mbti', icon: Activity, label: 'MBTI', desc: '동양 철학적 해석' },
    { id: 'saju', icon: ScrollText, label: '사주', desc: '생년월일시 기반' },
    { id: 'face', icon: ScanFace, label: '관상', desc: '얼굴 기운 분석' },
    { id: 'couple', icon: Heart, label: '궁합', desc: '두 사람의 궁합' },
  ];

  return (
    <div className="glass-panel rounded-xl p-4 border border-void-700/50">
      <h3 className="text-sm font-medium text-gray-300 mb-3">상담 모드 선택</h3>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                isActive
                  ? 'bg-gold-500/20 border-gold-500/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                  : 'bg-void-900/50 border-void-700 hover:border-void-600 hover:bg-void-900/70'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={isActive ? 'text-gold-400' : 'text-gray-500'} />
                <span className={`text-xs font-medium ${isActive ? 'text-gold-200' : 'text-gray-400'}`}>
                  {m.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-600">{m.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
