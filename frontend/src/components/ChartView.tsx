import { useState } from 'react';
import type { DailyObservation } from '../types/dashboard';

interface ChartViewProps {
  data: DailyObservation[];
  title?: string;
  subtitle?: string;
  height?: number;
  showMovingAverageToggle?: boolean;
  isAuthentic?: boolean;
}

export const ChartView: React.FC<ChartViewProps> = ({
  data,
  title = 'Historical Active-Fire Detections',
  subtitle = 'Daily satellite-observed hotspot counts over time',
  height = 280,
  showMovingAverageToggle = true,
  isAuthentic = false,
}) => {
  const [showMA, setShowMA] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>No observation data available to plot.</p>
      </div>
    );
  }

  // Padding & bounds
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const width = 800; // SVG viewBox coordinate width

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Min and max values
  const counts = data.map((d) => d.count);
  const maValues = data.map((d) => d.movingAverage7d ?? d.count);
  const allValues = showMA ? [...counts, ...maValues] : counts;

  const maxVal = Math.max(...allValues, 10);
  const minVal = 0; // always anchor to 0 for count data

  // Coordinate scales
  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (index / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return paddingTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
  };

  // Build SVG Path for actual counts
  const countPoints = data.map((d, i) => `${getX(i)},${getY(d.count)}`);
  const countLinePath = `M ${countPoints.join(' L ')}`;
  const countAreaPath = `${countLinePath} L ${getX(data.length - 1)},${paddingTop + chartH} L ${getX(0)},${paddingTop + chartH} Z`;

  // Build SVG Path for 7-day MA
  const maPoints = data.map((d, i) => `${getX(i)},${getY(d.movingAverage7d ?? d.count)}`);
  const maLinePath = `M ${maPoints.join(' L ')}`;

  // Horizontal grid lines (4 ticks)
  const ticksCount = 4;
  const yTicks = Array.from({ length: ticksCount + 1 }, (_, i) => {
    const val = Math.round((maxVal / ticksCount) * i);
    return {
      value: val,
      y: getY(val),
    };
  });

  // Pick representative X-axis date labels (start, middle, end)
  const dateStep = Math.max(1, Math.floor(data.length / 5));
  const xLabels = data.filter((_, i) => i % dateStep === 0 || i === data.length - 1);

  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>

        <div className="chart-controls">
          {isAuthentic ? (
            <span className="nasa-live-badge">AUTHENTIC NASA DATA</span>
          ) : (
            <span className="demo-tag">DEMO DATA</span>
          )}
          {showMovingAverageToggle && (
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showMA}
                onChange={(e) => setShowMA(e.target.checked)}
              />
              <span className="toggle-indicator ma-color"></span>
              7-Day Rolling Mean
            </label>
          )}
        </div>
      </div>

      <div className="svg-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="interactive-svg"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title}. ${subtitle}. Showing ${data.length} observations from ${data[0]?.date} to ${data[data.length - 1]?.date}.`}
        >
          <defs>
            <linearGradient id="forestAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#059669" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={`grid-${i}`} className="grid-line-group">
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="#162e24"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="axis-label-text"
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={countAreaPath} fill="url(#forestAreaGrad)" />

          {/* Actual Count Line */}
          <path
            d={countLinePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 7-Day Moving Average Line */}
          {showMA && (
            <path
              d={maLinePath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          )}

          {/* Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.count);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={`point-${i}`}
                role="button"
                tabIndex={0}
                aria-label={`Observation on ${d.date}: ${d.count} active-fire detections, 7-day average: ${d.movingAverage7d ?? 'N/A'}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(i)}
                onBlur={() => setHoveredIdx(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setHoveredIdx(i);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Hit area */}
                <circle cx={cx} cy={cy} r="12" fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 3.5}
                  fill={isHovered ? '#34d399' : '#10b981'}
                  stroke="#08130f"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Hover guideline */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={paddingTop}
              x2={getX(hoveredIdx)}
              y2={paddingTop + chartH}
              stroke="#34d399"
              strokeDasharray="2 2"
              strokeWidth="1.5"
            />
          )}

          {/* X Axis Labels */}
          {xLabels.map((d, i) => {
            const origIdx = data.findIndex((item) => item.date === d.date);
            const xPos = getX(origIdx);
            return (
              <text
                key={`x-label-${i}`}
                x={xPos}
                y={height - 12}
                textAnchor="middle"
                className="axis-label-text"
              >
                {d.date.slice(5)} {/* MM-DD */}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint && hoveredIdx !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: `${Math.max(10, (getY(activePoint.count) / height) * 100 - 30)}%`,
            }}
          >
            <div className="tooltip-date">{activePoint.date}</div>
            <div className="tooltip-row">
              <span className="tooltip-dot count-dot"></span>
              <span>Observed Hotspots:</span>
              <strong>{activePoint.count}</strong>
            </div>
            {showMA && activePoint.movingAverage7d !== undefined && (
              <div className="tooltip-row">
                <span className="tooltip-dot ma-dot"></span>
                <span>7-Day Rolling Mean:</span>
                <strong>{activePoint.movingAverage7d}</strong>
              </div>
            )}
            <div className="tooltip-sub">
              <span>Sensor: {activePoint.satellite}</span> • <span>Cloud: {activePoint.cloudCoverEstimatePct}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color-line actual-line"></span>
          <span>Daily Satellite Hotspot Count</span>
        </div>
        {showMA && (
          <div className="legend-item">
            <span className="legend-color-line ma-line"></span>
            <span>7-Day Moving Average</span>
          </div>
        )}
      </div>
    </div>
  );
};
