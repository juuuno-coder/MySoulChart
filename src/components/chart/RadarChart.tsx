import React from 'react';

interface RadarChartProps {
  dimensions: {
    intuition: number;
    emotion: number;
    logic: number;
    social: number;
    creativity: number;
  };
  size?: number;
}

const LABELS = [
  { key: 'intuition', label: '직관력' },
  { key: 'emotion', label: '감성' },
  { key: 'logic', label: '논리력' },
  { key: 'social', label: '사회성' },
  { key: 'creativity', label: '창의력' },
] as const;

/**
 * 5각형 레이더 차트 (SVG, 라이브러리 없음)
 */
const RadarChart: React.FC<RadarChartProps> = ({ dimensions, size = 280 }) => {
  const center = size / 2;
  const radius = size * 0.35;
  const labelOffset = size * 0.46;
  const numAxes = 5;
  const angleStep = (2 * Math.PI) / numAxes;
  // 12시 방향부터 시작 (-90도)
  const startAngle = -Math.PI / 2;

  /** 극좌표 → 직교좌표 */
  const getPoint = (index: number, value: number): [number, number] => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  /** 다각형 경로 생성 */
  const polygonPath = (values: number[]): string => {
    return values
      .map((v, i) => {
        const [x, y] = getPoint(i, v);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ') + ' Z';
  };

  // 배경 그리드 (20, 40, 60, 80, 100)
  const gridLevels = [20, 40, 60, 80, 100];

  // 데이터 값
  const values = LABELS.map(({ key }) => dimensions[key]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]"
    >
      <defs>
        {/* 데이터 영역 그라데이션 */}
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.2" />
        </radialGradient>
        {/* 글로우 효과 */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 배경 그리드 */}
      {gridLevels.map((level) => (
        <path
          key={level}
          d={polygonPath(Array(numAxes).fill(level))}
          fill="none"
          stroke="rgba(139, 92, 246, 0.15)"
          strokeWidth="1"
        />
      ))}

      {/* 축 선 */}
      {LABELS.map((_, i) => {
        const [x, y] = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="1"
          />
        );
      })}

      {/* 데이터 영역 */}
      <path
        d={polygonPath(values)}
        fill="url(#radarFill)"
        stroke="#8b5cf6"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* 데이터 포인트 */}
      {values.map((v, i) => {
        const [x, y] = getPoint(i, v);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="#8b5cf6"
            stroke="#c4b5fd"
            strokeWidth="2"
          />
        );
      })}

      {/* 라벨 + 수치 */}
      {LABELS.map(({ label, key }, i) => {
        const angle = startAngle + i * angleStep;
        const lx = center + labelOffset * Math.cos(angle);
        const ly = center + labelOffset * Math.sin(angle);
        const value = dimensions[key];

        return (
          <g key={key}>
            <text
              x={lx}
              y={ly - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-300 text-xs font-medium"
              style={{ fontSize: '11px' }}
            >
              {label}
            </text>
            <text
              x={lx}
              y={ly + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-nebula-300 text-xs font-bold"
              style={{ fontSize: '12px' }}
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default RadarChart;
