import React, { useRef, useState, useCallback } from 'react';
import { SoulChartData } from '../../types/chart';
import AstroWheel from './AstroWheel';
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle, Compass, Palette, Hash, Sun, Leaf } from 'lucide-react';

interface SoulChartViewProps {
  soulChart: SoulChartData;
  userName: string;
  onStartQnA?: () => void;
  onGoBack?: () => void;
}

/** Aceternity-style Spotlight card */
function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Spotlight gradient */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(139,92,246,0.12), transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}

/** Animated gradient border wrapper */
function GlowBorder({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative p-[1px] rounded-2xl overflow-hidden ${className}`}>
      {/* 회전하는 그라데이션 보더 */}
      <div className="absolute inset-0 astro-border-spin rounded-2xl" />
      <div className="relative rounded-2xl bg-cosmic-950/90 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

/** 유성(Meteor) 라인 */
function Meteor({ delay, top, left }: { delay: number; top: string; left: string }) {
  return (
    <span
      className="absolute pointer-events-none meteor-line"
      style={{
        top,
        left,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/** fadeInUp 모션 variants */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const },
  }),
};

/**
 * 종합 영혼 차트 결과 뷰 (Aceternity UI + Astrological Wheel)
 */
const SoulChartView: React.FC<SoulChartViewProps> = ({
  soulChart,
  userName,
  onStartQnA,
  onGoBack,
}) => {
  const {
    soulType,
    soulDescription,
    dimensions,
    coreTraits,
    hiddenDesire,
    lifeAdvice,
    luckyElements,
  } = soulChart;

  return (
    <div className="min-h-full overflow-y-auto scrollbar-hide relative">
      {/* 유성 배경 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Meteor delay={0} top="5%" left="80%" />
        <Meteor delay={2.5} top="15%" left="20%" />
        <Meteor delay={5} top="40%" left="65%" />
        <Meteor delay={7.5} top="60%" left="35%" />
        <Meteor delay={10} top="80%" left="75%" />
      </div>

      <div className="relative z-10 py-8 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* ===== 헤더 ===== */}
            <motion.div variants={fadeUp} custom={0} className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nebula-500/15 border border-nebula-500/25">
                <Sparkles className="w-4 h-4 text-nebula-300 star-twinkle" />
                <span className="text-sm text-nebula-200 font-medium tracking-wide">영혼 차트 완성</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-serif">
                {userName}님의 영혼 차트
              </h1>
            </motion.div>

            {/* ===== 영혼 유형 히어로 카드 ===== */}
            <motion.div variants={fadeUp} custom={1}>
              <GlowBorder>
                <SpotlightCard className="p-8 md:p-10 text-center">
                  <div className="space-y-5">
                    <p className="text-xs text-nebula-300/60 uppercase tracking-[0.25em] font-medium">
                      Soul Type
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold font-serif soul-type-gradient">
                      {soulType}
                    </h2>
                    <p className="text-gray-300/90 leading-relaxed max-w-lg mx-auto font-book text-base md:text-lg">
                      {soulDescription}
                    </p>
                  </div>
                </SpotlightCard>
              </GlowBorder>
            </motion.div>

            {/* ===== 점성학 휠 차트 ===== */}
            <motion.div variants={fadeUp} custom={2}>
              <SpotlightCard className="glass-panel border border-cosmic-700 p-6 md:p-8">
                <div className="flex flex-col items-center">
                  <p className="text-xs text-nebula-300/50 uppercase tracking-[0.2em] mb-6">
                    Dimensional Map
                  </p>
                  <AstroWheel
                    dimensions={dimensions}
                    soulType={soulType}
                    size={340}
                  />
                </div>
              </SpotlightCard>
            </motion.div>

            {/* ===== 핵심 특성 ===== */}
            <motion.div variants={fadeUp} custom={3}>
              <SpotlightCard className="glass-panel border border-cosmic-700 p-6">
                <p className="text-xs text-nebula-300/50 uppercase tracking-[0.2em] mb-4">
                  Core Traits
                </p>
                <div className="flex flex-wrap gap-2">
                  {coreTraits.map((trait, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
                      className="trait-chip"
                    >
                      {trait}
                    </motion.span>
                  ))}
                </div>
              </SpotlightCard>
            </motion.div>

            {/* ===== 숨겨진 욕구 + 인생 조언 (2단) ===== */}
            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 숨겨진 욕구 */}
              <GlowBorder>
                <div className="p-6 h-full">
                  <p className="text-xs uppercase tracking-[0.2em] mb-3"
                    style={{ color: '#f9a8d4' }}>
                    Hidden Desire
                  </p>
                  <p className="text-white/90 leading-relaxed font-book text-base">
                    {hiddenDesire}
                  </p>
                </div>
              </GlowBorder>

              {/* 인생 조언 */}
              <GlowBorder>
                <div className="p-6 h-full">
                  <p className="text-xs uppercase tracking-[0.2em] mb-3"
                    style={{ color: '#fde68a' }}>
                    Life Advice
                  </p>
                  <p className="text-white/90 leading-relaxed font-serif text-base">
                    "{lifeAdvice}"
                  </p>
                </div>
              </GlowBorder>
            </motion.div>

            {/* ===== 행운 요소 ===== */}
            <motion.div variants={fadeUp} custom={5}>
              <SpotlightCard className="glass-panel border border-cosmic-700 p-6">
                <p className="text-xs text-nebula-300/50 uppercase tracking-[0.2em] mb-4">
                  Lucky Elements
                </p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  <LuckyOrb icon={<Palette className="w-5 h-5" />} label="색상" value={luckyElements.color} color="#c4b5fd" />
                  <LuckyOrb icon={<Hash className="w-5 h-5" />} label="숫자" value={String(luckyElements.number)} color="#93c5fd" />
                  <LuckyOrb icon={<Compass className="w-5 h-5" />} label="방향" value={luckyElements.direction} color="#86efac" />
                  <LuckyOrb icon={<Sun className="w-5 h-5" />} label="계절" value={luckyElements.season} color="#fde68a" />
                  <LuckyOrb icon={<Leaf className="w-5 h-5" />} label="원소" value={luckyElements.element} color="#f9a8d4" />
                </div>
              </SpotlightCard>
            </motion.div>

            {/* ===== CTA 버튼 ===== */}
            <motion.div variants={fadeUp} custom={6} className="space-y-3 pb-8">
              {onStartQnA && (
                <button
                  onClick={onStartQnA}
                  className="group w-full relative flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg text-white transition-all overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)',
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    영혼 차트로 대화하기
                  </span>
                  {/* Hover 빛 효과 */}
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                </button>
              )}
              {onGoBack && (
                <button
                  onClick={onGoBack}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cosmic-800/50 hover:bg-cosmic-700/50 text-gray-400 hover:text-gray-300 rounded-xl font-medium transition-colors border border-cosmic-700/50"
                >
                  돌아가기
                </button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/** 행운 요소 - 원형 오브 스타일 */
function LuckyOrb({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: `${color}10`,
          border: `1px solid ${color}30`,
          boxShadow: `0 0 20px ${color}15`,
        }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-white font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default SoulChartView;
