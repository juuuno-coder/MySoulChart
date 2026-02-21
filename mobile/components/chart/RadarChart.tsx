import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';

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

const LABELS = ['직관', '감성', '논리', '사회성', '창의력'];
const KEYS: (keyof RadarChartProps['dimensions'])[] = [
  'intuition', 'emotion', 'logic', 'social', 'creativity',
];

export default function RadarChart({ dimensions, size = 240 }: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 36;
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2; // 12시 방향부터

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 배경 격자 (20, 40, 60, 80, 100)
  const gridLevels = [20, 40, 60, 80, 100];

  // 데이터 폴리곤 포인트
  const dataPoints = KEYS.map((key, i) => getPoint(i, dimensions[key]));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* 배경 격자 */}
        {gridLevels.map((level) => {
          const points = Array.from({ length: 5 }, (_, i) => {
            const p = getPoint(i, level);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <Polygon
              key={level}
              points={points}
              fill="none"
              stroke="#1a1a42"
              strokeWidth={1}
            />
          );
        })}

        {/* 축 라인 */}
        {Array.from({ length: 5 }, (_, i) => {
          const p = getPoint(i, 100);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="#1a1a4280"
              strokeWidth={1}
            />
          );
        })}

        {/* 데이터 영역 */}
        <Polygon
          points={dataPolygon}
          fill="#9333ea20"
          stroke="#9333ea"
          strokeWidth={2}
        />

        {/* 데이터 포인트 */}
        {dataPoints.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#c084fc"
            stroke="#9333ea"
            strokeWidth={1.5}
          />
        ))}

        {/* 라벨 */}
        {LABELS.map((label, i) => {
          const p = getPoint(i, 125);
          return (
            <SvgText
              key={`label-${i}`}
              x={p.x}
              y={p.y}
              fontSize={12}
              fill="#9da3ff"
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* 수치 표시 */}
      <View style={styles.values}>
        {KEYS.map((key, i) => (
          <View key={key} style={styles.valueItem}>
            <Text style={styles.valueLabel}>{LABELS[i]}</Text>
            <Text style={styles.valueNumber}>{dimensions[key]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  values: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 12, marginTop: 16,
  },
  valueItem: {
    backgroundColor: '#12122e', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, alignItems: 'center',
  },
  valueLabel: { fontSize: 11, color: '#9da3ff80' },
  valueNumber: { fontSize: 16, fontWeight: '700', color: '#c084fc' },
});
