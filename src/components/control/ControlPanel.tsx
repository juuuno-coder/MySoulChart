
import React, { useState } from 'react';
import { UserProfile, AnalysisMode, CalendarType } from '../../types';
import { Settings, User, ScrollText, Dna, Activity, ScanFace, Brain, Heart, Upload, CheckCircle, Loader2, Play, Sparkles } from 'lucide-react';
import { analyzeFace } from '../../services/api';
import { showToast } from '../../utils/toast';
import { validateImageFile } from '../../utils/fileValidation';
import KakaoLoginButton from '../auth/KakaoLoginButton';

interface ControlPanelProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  mode: AnalysisMode;
  onModeChange: (m: AnalysisMode) => void;
  onStartSession: () => void; // New prop to trigger start
  onReset: () => void;
  depthScore: number;
  isSessionActive: boolean; // Check if started
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    profile, setProfile, mode, onModeChange, onStartSession, onReset, depthScore, isSessionActive 
}) => {
  const [isAnalyzingPartner, setIsAnalyzingPartner] = useState(false);
  const [isAnalyzingUser, setIsAnalyzingUser] = useState(false); // New state for user face
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleCalendarChange = (type: CalendarType) => {
    setProfile({ ...profile, calendarType: type });
  };

  const handlePartnerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile({ 
        ...profile, 
        partner: { 
            ...(profile.partner || {
                name: '', birthDate: '', calendarType: 'solar', birthTime: '', birthPlace: '', bloodType: '', mbti: '', gender: 'other'
            }), 
            [name]: value 
        } 
    });
  };

  // --- Image Upload Handlers ---

  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast('warning', validation.error!);
      // 파일 input 초기화
      e.target.value = '';
      return;
    }

    setIsAnalyzingUser(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        // Immediate Analysis for User
        const features = await analyzeFace(base64);

        // Convert features object to text description
        const featuresText = `얼굴형: ${features.faceShape}, 이마: ${features.forehead}, 눈: ${features.eyes}, 코: ${features.nose}, 입: ${features.mouth}, 턱: ${features.chin}`;

        setProfile({
          ...profile,
          faceFeatures: featuresText,
        });
      } catch (error) {
        console.error("User Face Analysis Failed", error);
        showToast('error', '관상을 읽는데 기가 막혔구나... 다시 시도해보게.');
      } finally {
        setIsAnalyzingUser(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePartnerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast('warning', validation.error!);
      // 파일 input 초기화
      e.target.value = '';
      return;
    }

    setIsAnalyzingPartner(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        // Immediate Analysis for Partner
        const features = await analyzeFace(base64);

        // Convert features object to text description
        const featuresText = `얼굴형: ${features.faceShape}, 이마: ${features.forehead}, 눈: ${features.eyes}, 코: ${features.nose}, 입: ${features.mouth}, 턱: ${features.chin}`;

        setProfile({
          ...profile,
          partner: {
            ...(profile.partner || {
              name: '', birthDate: '', calendarType: 'solar', birthTime: '', birthPlace: '', bloodType: '', mbti: '', gender: 'other'
            }),
            faceFeatures: featuresText
          }
        });
      } catch (error) {
        console.error("Partner Face Analysis Failed", error);
        showToast('error', '상대방의 기운을 읽는데 실패했네... 다시 한번 해보게.');
      } finally {
        setIsAnalyzingPartner(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const modes: { id: AnalysisMode; label: string; icon: React.ReactNode }[] = [
    { id: 'integrated', label: '통합 심층 분석', icon: <Brain size={15} /> },
    { id: 'couple', label: '커플 궁합 (New)', icon: <Heart size={15} /> },
    { id: 'face', label: '관상학 분석', icon: <ScanFace size={15} /> },
    { id: 'blood', label: '혈액형 심리', icon: <Dna size={15} /> },
    { id: 'mbti', label: 'MBTI 인지구조', icon: <Activity size={15} /> },
    { id: 'saju', label: '사주명리 운세', icon: <ScrollText size={15} /> },
  ];

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 text-gray-400 border-b border-cosmic-800 pb-2 mb-3">
        <Icon size={14} className="text-nebula-500/70" />
        <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400">{title}</h3>
    </div>
  );

  return (
    <div className={`w-full md:w-80 flex-shrink-0 flex flex-col h-full bg-cosmic-950/90 backdrop-blur-xl border-r border-cosmic-800 overflow-y-auto p-5 z-20 scrollbar-hide ${isSessionActive ? 'hidden md:flex' : 'flex'}`}>
      
      <div className="flex items-center gap-2 mb-8 mt-2 text-nebula-400/80">
        <Settings className="w-5 h-5" />
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase">Control Center</h2>
      </div>

      {/* Kakao Login */}
      <div className="mb-6">
        <KakaoLoginButton />
      </div>

      {/* Depth Score - Visible only when session active */}
      {isSessionActive && (
        <div className="mb-10 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-nebula-500/20 to-violet-500/20 rounded-xl opacity-30 blur transition duration-500 group-hover:opacity-50"></div>
            <div className="relative bg-cosmic-900 p-5 rounded-xl border border-cosmic-700/50 overflow-hidden">
                <div className="flex justify-between items-end mb-3 relative z-10">
                    <span className="text-[10px] font-bold text-nebula-500 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={10} /> 분석 심도
                    </span>
                    <span className="text-3xl font-serif font-bold text-gray-100">{depthScore}<span className="text-sm font-sans font-light text-gray-600 ml-0.5">%</span></span>
                </div>
                
                <div className="w-full bg-cosmic-950 h-1.5 rounded-full overflow-hidden relative z-10 border border-cosmic-800">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${
                            depthScore >= 70 ? 'bg-emerald-500 text-emerald-500' : 'bg-nebula-500 text-nebula-500'
                        }`}
                        style={{ width: `${depthScore}%` }}
                    ></div>
                </div>
            </div>
        </div>
      )}

      {/* User Profile Section */}
      <div className="mb-8 space-y-5">
        <SectionHeader icon={User} title="Client Profile (본인)" />
        
        <div className="space-y-3">
          {/* User Face Upload - Now in Control Panel */}
          <div className="mb-4">
            <label className="block text-[10px] text-gray-500 mb-2 ml-1">본인 관상 사진</label>
            {isAnalyzingUser ? (
                 <div className="w-full h-16 rounded-lg bg-nebula-500/10 flex items-center justify-center border border-nebula-500/30">
                    <Loader2 className="animate-spin text-nebula-400" size={16} />
                    <span className="ml-2 text-xs text-nebula-200">얼굴 분석 중...</span>
                </div>
            ) : profile.faceFeatures ? (
                <div className="w-full p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <span className="text-xs text-emerald-200">관상 데이터 확보됨</span>
                    </div>
                    <label className="cursor-pointer text-[10px] underline text-emerald-400 hover:text-emerald-300">
                        재업로드
                        <input type="file" accept="image/*" className="hidden" onChange={handleUserImageUpload} />
                    </label>
                </div>
            ) : (
                <label className="w-full h-16 rounded-lg border border-dashed border-nebula-500/30 hover:bg-nebula-500/5 hover:border-nebula-500/50 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <Upload size={14} className="text-nebula-400/50 group-hover:text-nebula-400 mb-1" />
                    <span className="text-[10px] text-gold-300/70 group-hover:text-nebula-200">사진 업로드 (관상)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUserImageUpload} />
                </label>
            )}
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">이름</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              className="w-full glass-input rounded-md px-3 py-2.5 text-xs focus:outline-none"
            />
          </div>

          <div>
             <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">생년월일</label>
             <div className="flex flex-col gap-2">
                 <div className="flex bg-cosmic-900/50 rounded-md p-1 border border-cosmic-700/50 w-full">
                    <button
                        onClick={() => handleCalendarChange('solar')}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                            profile.calendarType === 'solar' 
                            ? 'bg-nebula-500 text-cosmic-950 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        양력
                    </button>
                    <button
                        onClick={() => handleCalendarChange('lunar')}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                            profile.calendarType === 'lunar' 
                            ? 'bg-violet-500 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        음력
                    </button>
                </div>
                <input
                    type="date"
                    name="birthDate"
                    value={profile.birthDate}
                    onChange={handleProfileChange}
                    className="w-full glass-input rounded-md px-2 py-2.5 text-[11px] focus:outline-none"
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">태어난 시간</label>
              <div className="flex gap-1">
                <select
                  value={(() => {
                    if (!profile.birthTime) return '';
                    const [h] = profile.birthTime.split(':');
                    return parseInt(h) < 12 ? 'AM' : 'PM';
                  })()}
                  onChange={(e) => {
                    const period = e.target.value;
                    if (!period) {
                      setProfile({ ...profile, birthTime: '' });
                      return;
                    }
                    const [h, m] = (profile.birthTime || '12:00').split(':');
                    let hour = parseInt(h);
                    if (period === 'AM' && hour >= 12) hour -= 12;
                    if (period === 'PM' && hour < 12) hour += 12;
                    setProfile({ ...profile, birthTime: `${String(hour).padStart(2, '0')}:${m || '00'}` });
                  }}
                  className="w-[52px] glass-input rounded-md px-1 py-2.5 text-[10px] focus:outline-none appearance-none text-center"
                >
                  <option value="">--</option>
                  <option value="AM" className="bg-cosmic-900">오전</option>
                  <option value="PM" className="bg-cosmic-900">오후</option>
                </select>
                <select
                  value={(() => {
                    if (!profile.birthTime) return '';
                    const [h] = profile.birthTime.split(':');
                    let hour = parseInt(h) % 12;
                    if (hour === 0) hour = 12;
                    return String(hour);
                  })()}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [h, m] = (profile.birthTime || '12:00').split(':');
                    const isPM = parseInt(h) >= 12;
                    let newHour = parseInt(e.target.value);
                    if (newHour === 12) newHour = isPM ? 12 : 0;
                    else if (isPM) newHour += 12;
                    setProfile({ ...profile, birthTime: `${String(newHour).padStart(2, '0')}:${m || '00'}` });
                  }}
                  className="flex-1 glass-input rounded-md px-1 py-2.5 text-[10px] focus:outline-none appearance-none text-center"
                >
                  <option value="">시</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={String(h)} className="bg-cosmic-900">{h}시</option>
                  ))}
                </select>
                <select
                  value={(() => {
                    if (!profile.birthTime) return '';
                    const parts = profile.birthTime.split(':');
                    return parts[1] || '';
                  })()}
                  onChange={(e) => {
                    const [h] = (profile.birthTime || '12:00').split(':');
                    setProfile({ ...profile, birthTime: `${h}:${e.target.value}` });
                  }}
                  className="flex-1 glass-input rounded-md px-1 py-2.5 text-[10px] focus:outline-none appearance-none text-center"
                >
                  <option value="">분</option>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                    <option key={m} value={String(m).padStart(2, '0')} className="bg-cosmic-900">{m}분</option>
                  ))}
                </select>
              </div>
            </div>
             <div>
              <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">출생 지역</label>
              <input
                type="text"
                name="birthPlace"
                value={profile.birthPlace}
                onChange={handleProfileChange}
                placeholder="예: 서울"
                className="w-full glass-input rounded-md px-2 py-2.5 text-xs focus:outline-none"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">혈액형</label>
              <select
                name="bloodType"
                value={profile.bloodType}
                onChange={handleProfileChange}
                className="w-full glass-input rounded-md px-2 py-2.5 text-xs focus:outline-none appearance-none"
              >
                <option value="">선택</option>
                <option value="A" className="bg-cosmic-900">A형</option>
                <option value="B" className="bg-cosmic-900">B형</option>
                <option value="O" className="bg-cosmic-900">O형</option>
                <option value="AB" className="bg-cosmic-900">AB형</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">MBTI</label>
              <input
                type="text"
                name="mbti"
                value={profile.mbti}
                onChange={handleProfileChange}
                className="w-full glass-input rounded-md px-3 py-2.5 text-xs focus:outline-none uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Partner Profile Section */}
      {mode === 'couple' && (
        <div className="mb-8 space-y-5 animate-fadeIn">
            <SectionHeader icon={Heart} title="Partner Profile (상대방)" />
            
            <div className="space-y-3 bg-pink-900/10 p-3 rounded-xl border border-pink-500/10">
                
            {/* Partner Face Upload */}
            <div className="mb-4">
                <label className="block text-[10px] text-pink-300 mb-2 ml-1">상대방 관상 사진</label>
                {isAnalyzingPartner ? (
                    <div className="w-full h-16 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/30">
                        <Loader2 className="animate-spin text-pink-400" size={16} />
                        <span className="ml-2 text-xs text-pink-200">분석 중...</span>
                    </div>
                ) : profile.partner?.faceFeatures ? (
                    <div className="w-full p-3 rounded-lg border border-pink-500/30 bg-pink-500/10 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                           <CheckCircle size={16} className="text-pink-400" />
                           <span className="text-xs text-pink-200">데이터 확보됨</span>
                       </div>
                       <label className="cursor-pointer text-[10px] underline text-pink-400 hover:text-pink-300">
                           재업로드
                           <input type="file" accept="image/*" className="hidden" onChange={handlePartnerImageUpload} />
                       </label>
                    </div>
                ) : (
                    <label className="w-full h-16 rounded-lg border border-dashed border-pink-500/30 hover:bg-pink-500/5 hover:border-pink-500/50 flex flex-col items-center justify-center cursor-pointer transition-all group">
                        <Upload size={14} className="text-pink-400/50 group-hover:text-pink-400 mb-1" />
                        <span className="text-[10px] text-pink-300/70 group-hover:text-pink-200">사진 업로드</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePartnerImageUpload} />
                    </label>
                )}
            </div>

            <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">이름</label>
                <input
                type="text"
                name="name"
                value={profile.partner?.name || ''}
                onChange={handlePartnerChange}
                className="w-full glass-input rounded-md px-3 py-2.5 text-xs focus:outline-none border-pink-500/20 focus:border-pink-500"
                />
            </div>
             <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">생년월일</label>
                <input
                    type="date"
                    name="birthDate"
                    value={profile.partner?.birthDate || ''}
                    onChange={handlePartnerChange}
                    className="w-full glass-input rounded-md px-2 py-2.5 text-[11px] focus:outline-none border-pink-500/20 focus:border-pink-500"
                />
            </div>
             <div className="grid grid-cols-2 gap-2">
                <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">성별</label>
                <select
                    name="gender"
                    value={profile.partner?.gender || 'other'}
                    onChange={handlePartnerChange}
                    className="w-full glass-input rounded-md px-2 py-2.5 text-xs focus:outline-none appearance-none border-pink-500/20 focus:border-pink-500"
                >
                    <option value="male" className="bg-cosmic-900">남성</option>
                    <option value="female" className="bg-cosmic-900">여성</option>
                    <option value="other" className="bg-cosmic-900">기타</option>
                </select>
                </div>
                <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 ml-1">MBTI</label>
                <input
                    type="text"
                    name="mbti"
                    value={profile.partner?.mbti || ''}
                    onChange={handlePartnerChange}
                    className="w-full glass-input rounded-md px-3 py-2.5 text-xs focus:outline-none uppercase border-pink-500/20 focus:border-pink-500"
                />
                </div>
            </div>
            </div>
        </div>
      )}

      {/* Mode Selection */}
      <div className="mb-8 space-y-3">
         <SectionHeader icon={Activity} title="Analysis Lens" />
        <div className="grid grid-cols-1 gap-2 pt-1">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-xs transition-all duration-300 font-medium border ${
                mode === m.id
                  ? 'bg-cosmic-800 border-nebula-500/40 text-nebula-200 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                  : 'bg-transparent border-transparent text-gray-500 hover:bg-cosmic-800 hover:text-gray-300'
              }`}
            >
              <span className={mode === m.id ? 'text-nebula-400' : 'text-gray-600'}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-cosmic-800 space-y-3">
        {/* START BUTTON */}
        <button
          onClick={onStartSession}
          disabled={isAnalyzingUser || isAnalyzingPartner}
          className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 font-bold tracking-widest text-xs transition-all duration-500 shadow-lg ${
             isSessionActive 
             ? 'bg-cosmic-800 border border-nebula-500/30 text-nebula-400 hover:bg-nebula-500/10' 
             : 'bg-gradient-to-r from-nebula-500 to-nebula-400 text-cosmic-950 hover:from-nebula-500 hover:to-gold-300 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
          }`}
        >
          <Play size={12} fill="currentColor" />
          {isSessionActive ? "UPDATE ANALYSIS" : "INITIATE CONSULTATION"}
        </button>

        {isSessionActive && (
            <button
            onClick={onReset}
            className="w-full py-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all uppercase text-[10px] tracking-widest font-bold"
            >
            RESET ALL
            </button>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
