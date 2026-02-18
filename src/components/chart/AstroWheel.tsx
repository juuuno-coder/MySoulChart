import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AstroWheelProps {
  dimensions: {
    intuition: number;
    emotion: number;
    logic: number;
    social: number;
    creativity: number;
  };
  soulType: string;
  size?: number;
}

const DIMENSION_CONFIG = [
  { key: 'intuition', label: '직관력', symbol: '☽', color: '#c4b5fd', glowColor: '#8b5cf6' },
  { key: 'emotion', label: '감성', symbol: '♆', color: '#f9a8d4', glowColor: '#ec4899' },
  { key: 'logic', label: '논리력', symbol: '☿', color: '#93c5fd', glowColor: '#3b82f6' },
  { key: 'social', label: '사회성', symbol: '♀', color: '#86efac', glowColor: '#22c55e' },
  { key: 'creativity', label: '창의력', symbol: '♃', color: '#fde68a', glowColor: '#f59e0b' },
] as const;

/** 도 → 라디안 */
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** 극좌표 → SVG 좌표 */
const polarToXY = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = toRad(angleDeg - 90); // 12시 방향 기준
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/** SVG arc path */
const arcPath = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

const AstroWheel: React.FC<AstroWheelProps> = ({ dimensions, soulType, size = 340 }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 라벨이 잘리지 않도록 패딩 추가
  const pad = 44;
  const svgW = size + pad * 2;
  const svgH = size + pad * 2;
  const cx = svgW / 2;
  const cy = svgH / 2;

  // 반지름 설정 (size 기준 유지)
  const outerRingR = size * 0.40;     // 바깥 장식 링
  const arcTrackR = size * 0.33;      // 아크 트랙 (배경)
  const arcR = size * 0.33;           // 아크 데이터
  const innerRingR = size * 0.22;     // 안쪽 링
  const centerR = size * 0.16;        // 중심 원

  const segmentAngle = 360 / 5;       // 72도씩
  const arcGap = 6;                   // 세그먼트 간 간격 (도)
  const arcStroke = size * 0.045;     // 아크 두께

  return (
    <div className="relative" style={{ width: svgW, height: svgH }}>
      {/* 배경 글로우 */}
      <div
        className="absolute rounded-full opacity-40 blur-3xl"
        style={{
          top: pad, left: pad, width: size, height: size,
          background: 'radial-gradient(circle, #8b5cf640 0%, #14b8a620 40%, transparent 70%)',
        }}
      />

      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="relative z-10"
      >
        <defs>
          {/* 각 차원별 그라데이션 */}
          {DIMENSION_CONFIG.map((dim, i) => {
            const startAngle = i * segmentAngle;
            const start = polarToXY(cx, cy, arcR, startAngle);
            const end = polarToXY(cx, cy, arcR, startAngle + segmentAngle);
            return (
              <linearGradient
                key={`grad-${dim.key}`}
                id={`grad-${dim.key}`}
                x1={start.x} y1={start.y}
                x2={end.x} y2={end.y}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={dim.color} stopOpacity="1" />
                <stop offset="100%" stopColor={dim.glowColor} stopOpacity="0.8" />
              </linearGradient>
            );
          })}

          {/* 글로우 필터 */}
          {DIMENSION_CONFIG.map((dim) => (
            <filter key={`glow-${dim.key}`} id={`glow-${dim.key}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={dim.glowColor} floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}

          {/* 중심 그라데이션 */}
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1d0533" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#0a0118" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2b0a4a" stopOpacity="0.8" />
          </radialGradient>

          {/* 회전 마스크 */}
          <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="85%" stopColor="#8b5cf6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {/* === 바깥 장식 링 === */}
        <circle
          cx={cx} cy={cy} r={outerRingR}
          fill="none"
          stroke="rgba(139, 92, 246, 0.15)"
          strokeWidth="1"
        />
        <circle
          cx={cx} cy={cy} r={outerRingR + 4}
          fill="none"
          stroke="rgba(139, 92, 246, 0.08)"
          strokeWidth="0.5"
        />

        {/* 바깥 눈금 (36개, 10도마다) */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10;
          const isMajor = i % 3 === 0;
          const r1 = outerRingR - (isMajor ? 6 : 3);
          const r2 = outerRingR;
          const p1 = polarToXY(cx, cy, r1, angle);
          const p2 = polarToXY(cx, cy, r2, angle);
          return (
            <line
              key={`tick-${i}`}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke={isMajor ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.15)'}
              strokeWidth={isMajor ? 1.5 : 0.5}
            />
          );
        })}

        {/* === 안쪽 장식 링 === */}
        <circle
          cx={cx} cy={cy} r={innerRingR}
          fill="none"
          stroke="rgba(139, 92, 246, 0.12)"
          strokeWidth="0.5"
          strokeDasharray="2 4"
        />

        {/* === 세그먼트 구분선 === */}
        {DIMENSION_CONFIG.map((_, i) => {
          const angle = i * segmentAngle;
          const p1 = polarToXY(cx, cy, innerRingR + 4, angle);
          const p2 = polarToXY(cx, cy, outerRingR - 8, angle);
          return (
            <line
              key={`div-${i}`}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke="rgba(139, 92, 246, 0.2)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* === 아크 트랙 (배경) === */}
        {DIMENSION_CONFIG.map((dim, i) => {
          const startAngle = i * segmentAngle + arcGap / 2;
          const endAngle = (i + 1) * segmentAngle - arcGap / 2;
          return (
            <path
              key={`track-${dim.key}`}
              d={arcPath(cx, cy, arcTrackR, startAngle, endAngle)}
              fill="none"
              stroke="rgba(139, 92, 246, 0.08)"
              strokeWidth={arcStroke}
              strokeLinecap="round"
            />
          );
        })}

        {/* === 데이터 아크 (애니메이션) === */}
        {DIMENSION_CONFIG.map((dim, i) => {
          const value = dimensions[dim.key];
          const startAngle = i * segmentAngle + arcGap / 2;
          const fullSpan = segmentAngle - arcGap;
          const valueSpan = (value / 100) * fullSpan;
          const endAngle = startAngle + (animated ? valueSpan : 0);

          // 아크 길이 계산 (애니메이션용)
          const fullArcLength = (fullSpan / 360) * 2 * Math.PI * arcR;
          const valueArcLength = (valueSpan / 360) * 2 * Math.PI * arcR;

          return (
            <path
              key={`arc-${dim.key}`}
              d={arcPath(cx, cy, arcR, startAngle, startAngle + fullSpan)}
              fill="none"
              stroke={`url(#grad-${dim.key})`}
              strokeWidth={arcStroke}
              strokeLinecap="round"
              filter={`url(#glow-${dim.key})`}
              strokeDasharray={`${fullArcLength}`}
              strokeDashoffset={animated ? fullArcLength - valueArcLength : fullArcLength}
              style={{
                transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: `${i * 0.15}s`,
              }}
            />
          );
        })}

        {/* === 심볼 + 라벨 === */}
        {DIMENSION_CONFIG.map((dim, i) => {
          const midAngle = i * segmentAngle + segmentAngle / 2;
          const symbolPos = polarToXY(cx, cy, outerRingR + 24, midAngle);
          const value = dimensions[dim.key];

          return (
            <g key={`label-${dim.key}`}>
              {/* 행성 심볼 */}
              <text
                x={symbolPos.x}
                y={symbolPos.y - 9}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: '16px', fill: dim.color, opacity: 0.9 }}
              >
                {dim.symbol}
              </text>
              {/* 라벨 */}
              <text
                x={symbolPos.x}
                y={symbolPos.y + 6}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: '9px', fill: 'rgba(196, 181, 253, 0.7)' }}
              >
                {dim.label}
              </text>
              {/* 수치 */}
              <text
                x={symbolPos.x}
                y={symbolPos.y + 18}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: '11px', fill: dim.color, fontWeight: 700 }}
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* === 중심 원 === */}
        <circle
          cx={cx} cy={cy} r={centerR}
          fill="url(#centerGrad)"
          stroke="rgba(139, 92, 246, 0.3)"
          strokeWidth="1"
        />
        {/* 중심 안쪽 글로우 링 */}
        <circle
          cx={cx} cy={cy} r={centerR - 3}
          fill="none"
          stroke="rgba(139, 92, 246, 0.15)"
          strokeWidth="0.5"
        />

        {/* === 중심 텍스트 (Soul Type) === */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '8px',
            fill: 'rgba(196, 181, 253, 0.6)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          SOUL TYPE
        </text>
        {/* 긴 이름은 줄바꿈 처리 */}
        {soulType.length <= 6 ? (
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: '15px',
              fill: '#c4b5fd',
              fontWeight: 700,
              fontFamily: "'Noto Serif KR', serif",
            }}
          >
            {soulType}
          </text>
        ) : (
          <>
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '13px',
                fill: '#c4b5fd',
                fontWeight: 700,
                fontFamily: "'Noto Serif KR', serif",
              }}
            >
              {soulType.slice(0, Math.ceil(soulType.length / 2))}
            </text>
            <text
              x={cx}
              y={cy + 21}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '13px',
                fill: '#c4b5fd',
                fontWeight: 700,
                fontFamily: "'Noto Serif KR', serif",
              }}
            >
              {soulType.slice(Math.ceil(soulType.length / 2))}
            </text>
          </>
        )}

        {/* === 데이터 포인트 (아크 끝) === */}
        {DIMENSION_CONFIG.map((dim, i) => {
          const value = dimensions[dim.key];
          const startAngle = i * segmentAngle + arcGap / 2;
          const fullSpan = segmentAngle - arcGap;
          const valueSpan = (value / 100) * fullSpan;
          const endAngleDeg = startAngle + valueSpan;
          const pt = polarToXY(cx, cy, arcR, endAngleDeg);

          return animated ? (
            <motion.circle
              key={`dot-${dim.key}`}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill={dim.color}
              stroke="white"
              strokeWidth="1.5"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
            />
          ) : null;
        })}
      </svg>

      {/* 느린 회전 장식 링 (CSS 애니메이션) */}
      <div
        className="absolute rounded-full pointer-events-none astro-rotate"
        style={{
          border: '1px dashed rgba(139, 92, 246, 0.1)',
          top: pad - 8,
          left: pad - 8,
          width: size + 16,
          height: size + 16,
        }}
      />
    </div>
  );
};

export default AstroWheel;
