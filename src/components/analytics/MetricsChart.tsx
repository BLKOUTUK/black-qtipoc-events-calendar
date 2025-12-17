/**
 * Metrics Chart Component
 * Simple SVG-based chart visualization
 *
 * Liberation Feature: Visual data storytelling for community transparency
 */

import { useMemo } from 'react';

interface DataPoint {
  date: string;
  value: number | string;
}

interface MetricsChartProps {
  title: string;
  data: DataPoint[];
  color?: string;
  height?: number;
  showLabels?: boolean;
  showGrid?: boolean;
}

export function MetricsChart({
  title,
  data,
  color = '#FFD700',
  height = 200,
  showLabels = true,
  showGrid = true
}: MetricsChartProps) {
  const chartData = useMemo(() => {
    const values = data.map(d => typeof d.value === 'string' ? parseFloat(d.value) : d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = 400 - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = values.map((value, index) => ({
      x: padding.left + (index / (values.length - 1)) * chartWidth,
      y: padding.top + chartHeight - ((value - min) / range) * chartHeight,
      value,
      date: data[index].date
    }));

    // Create SVG path
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Create area path (for gradient fill)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    // Grid lines
    const gridLines = [];
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const y = padding.top + (i / numGridLines) * chartHeight;
      const value = max - (i / numGridLines) * range;
      gridLines.push({ y, value: Math.round(value) });
    }

    return { points, linePath, areaPath, gridLines, padding, chartWidth, chartHeight, max, min };
  }, [data, height]);

  const { points, linePath, areaPath, gridLines, padding, chartWidth, chartHeight } = chartData;

  // Calculate summary stats
  const values = data.map(d => typeof d.value === 'string' ? parseFloat(d.value) : d.value);
  const current = values[values.length - 1];
  const previous = values[values.length - 2] || current;
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const total = values.reduce((sum, v) => sum + v, 0);
  const average = total / values.length;

  return (
    <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">{title}</h3>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-white/60">Current: </span>
            <span className="text-white font-medium">{current.toLocaleString()}</span>
          </div>
          <div className={`px-2 py-1 rounded ${change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 400 ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid && gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={padding.left + chartWidth}
              y2={line.y}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="4"
            />
            {showLabels && (
              <text
                x={padding.left - 8}
                y={line.y + 4}
                textAnchor="end"
                className="fill-white/40 text-xs"
              >
                {line.value}
              </text>
            )}
          </g>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#gradient-${title.replace(/\s/g, '')})`}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              className="opacity-0 hover:opacity-100 transition-opacity"
            />
            {/* Tooltip area */}
            <rect
              x={point.x - 15}
              y={padding.top}
              width="30"
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
            >
              <title>{`${point.date}: ${point.value}`}</title>
            </rect>
          </g>
        ))}

        {/* X-axis labels */}
        {showLabels && (
          <>
            <text
              x={padding.left}
              y={height - 10}
              textAnchor="start"
              className="fill-white/40 text-xs"
            >
              {data[0]?.date?.slice(5) || ''}
            </text>
            <text
              x={padding.left + chartWidth}
              y={height - 10}
              textAnchor="end"
              className="fill-white/40 text-xs"
            >
              {data[data.length - 1]?.date?.slice(5) || ''}
            </text>
          </>
        )}
      </svg>

      {/* Footer stats */}
      <div className="flex justify-between mt-4 text-sm text-white/60">
        <span>Avg: {Math.round(average).toLocaleString()}</span>
        <span>Total: {Math.round(total).toLocaleString()}</span>
      </div>
    </div>
  );
}

/**
 * Simple Bar Chart Component
 */
interface BarChartProps {
  title: string;
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export function BarChart({ title, data, height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4">
      <h3 className="text-white font-bold mb-4">{title}</h3>

      <div className="space-y-3" style={{ minHeight: height }}>
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-white/80 text-sm truncate">{item.label}</div>
            <div className="flex-1">
              <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || '#FFD700'
                  }}
                />
              </div>
            </div>
            <div className="w-12 text-right text-white text-sm">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Donut Chart Component
 */
interface DonutChartProps {
  title: string;
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ title, data, size = 150 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - 20) / 2;
  const innerRadius = radius * 0.6;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90; // Start from top

  const segments = data.map(item => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    const endAngle = currentAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const x3 = centerX + innerRadius * Math.cos(endRad);
    const y3 = centerY + innerRadius * Math.sin(endRad);
    const x4 = centerX + innerRadius * Math.cos(startRad);
    const y4 = centerY + innerRadius * Math.sin(startRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const path = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;

    return { ...item, path, percentage: ((item.value / total) * 100).toFixed(1) };
  });

  return (
    <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4">
      <h3 className="text-white font-bold mb-4">{title}</h3>

      <div className="flex items-center gap-6">
        {/* Chart */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill={seg.color}
              className="transition-opacity hover:opacity-80"
            >
              <title>{`${seg.label}: ${seg.percentage}%`}</title>
            </path>
          ))}
          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            className="fill-white text-lg font-bold"
          >
            {total}
          </text>
          <text
            x={centerX}
            y={centerY + 12}
            textAnchor="middle"
            className="fill-white/60 text-xs"
          >
            Total
          </text>
        </svg>

        {/* Legend */}
        <div className="space-y-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-white/80 text-sm">{seg.label}</span>
              <span className="text-white/40 text-sm">({seg.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MetricsChart;
