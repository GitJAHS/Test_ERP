/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface CustomChartProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'line' | 'area' | 'pie';
  height?: number;
  color?: string;
  secondaryColor?: string;
}

export function CustomChart({
  title,
  data,
  type = 'bar',
  height = 240,
  color = '#6750A4',
  secondaryColor = '#EFB8C8',
}: CustomChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(380);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.max(100, entry.contentRect.width));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1);

  if (type === 'pie') {
    const total = values.reduce((sum, v) => sum + v, 0) || 1;
    let accumulatedAngle = 0;

    return (
      <div ref={containerRef} className="w-full flex flex-col md:flex-row items-center gap-6 p-4 bg-neutral-100/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40">
        <div className="relative w-[180px] h-[180px]">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {data.map((dp, i) => {
              const percentage = dp.value / total;
              const angle = percentage * 360;
              const x1 = 50 + 40 * Math.cos((accumulatedAngle - 90) * (Math.PI / 180));
              const y1 = 50 + 40 * Math.sin((accumulatedAngle - 90) * (Math.PI / 180));
              accumulatedAngle += angle;
              const x2 = 50 + 40 * Math.cos((accumulatedAngle - 90) * (Math.PI / 180));
              const y2 = 50 + 40 * Math.sin((accumulatedAngle - 90) * (Math.PI / 180));

              const largeArcFlag = angle > 180 ? 1 : 0;
              const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              // Generate discrete colors
              const colors = [color, secondaryColor, '#7D5260', '#381E72', '#0d47a1', '#e65100', '#2e7d32'];
              const segmentColor = colors[i % colors.length];

              return (
                <path
                  key={i}
                  d={pathData}
                  fill={segmentColor}
                  className="transition-all duration-300 hover:scale-105 cursor-pointer origin-center"
                  style={{ transformOrigin: '50px 50px' }}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                />
              );
            })}
          </svg>
        </div>
        <div className="flex-1 flex flex-col gap-2 w-full">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {data.map((dp, i) => {
              const colors = [color, secondaryColor, '#7D5260', '#381E72', '#0d47a1', '#e65100', '#2e7d32'];
              const segmentColor = colors[i % colors.length];
              const pct = ((dp.value / total) * 100).toFixed(1);
              const isActive = activeIdx === i;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${
                    isActive ? 'bg-neutral-200/50 dark:bg-neutral-800/50 shadow-sm' : ''
                  }`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  <span className="w-3" style={{ height: '12px', borderRadius: '4px', backgroundColor: segmentColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{dp.label}</p>
                    <p className="text-xs font-bold text-neutral-950 dark:text-neutral-100 flex justify-between">
                      <span>{dp.value.toLocaleString()}</span>
                      <span className="text-neutral-400 font-medium">{pct}%</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Bar, Line & Area Setup
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const pointsCount = data.length;
  const stepX = pointsCount > 1 ? chartWidth / (pointsCount - 1) : chartWidth;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + index * stepX;
    const ratio = val / maxValue;
    const y = paddingY + chartHeight * (1 - ratio);
    return { x, y };
  };

  const linePoints = data.map((dp, i) => getCoordinates(i, dp.value));

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Y-axis guidelines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + chartHeight * ratio;
            const gridValue = Math.round(maxValue * (1 - ratio));
            return (
              <g key={i} className="opacity-40">
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="text-neutral-300 dark:text-neutral-700"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  className="fill-neutral-400 font-medium"
                >
                  {gridValue >= 1000 ? `${(gridValue / 1000).toFixed(0)}k` : gridValue}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          {type === 'area' && linePoints.length > 0 && (
            <path
              d={`M ${linePoints[0].x} ${paddingY + chartHeight} L ${linePoints.map(p => `${p.x} ${p.y}`).join(' L ')} L ${linePoints[linePoints.length - 1].x} ${paddingY + chartHeight} Z`}
              fill={`url(#areaGrad-${title.replace(/\s+/g,'')})`}
              opacity="0.25"
            />
          )}

          {/* Core Line chart rendering */}
          {type === 'line' && linePoints.length > 0 && (
            <path
              d={`M ${linePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Bar Chart bars rendering */}
          {type === 'bar' && (
            <g>
              {data.map((dp, i) => {
                const ratio = dp.value / maxValue;
                const barH = chartHeight * ratio;
                const barWidth = Math.max(4, Math.min(30, (chartWidth / pointsCount) * 0.6));
                const x = paddingX + i * stepX - barWidth / 2;
                const y = paddingY + chartHeight - barH;
                const isHovered = activeIdx === i;

                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(2, barH)}
                    rx={4}
                    fill={isHovered ? secondaryColor : color}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseLeave={() => setActiveIdx(null)}
                  />
                );
              })}
            </g>
          )}

          {/* Grid interactive tracking line */}
          {activeIdx !== null && (
            <line
              x1={paddingX + activeIdx * stepX}
              y1={paddingY}
              x2={paddingX + activeIdx * stepX}
              y2={paddingY + chartHeight}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              className="text-neutral-400 dark:text-neutral-500"
            />
          )}

          {/* Circle markers for lines & areas */}
          {(type === 'line' || type === 'area') &&
            linePoints.map((p, i) => {
              const isHovered = activeIdx === i;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? secondaryColor : color}
                  stroke="var(--md-surface, #fff)"
                  strokeWidth={2}
                  className="transition-all duration-200 cursor-pointer shadow-sm"
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                />
              )
            })
          }

          {/* Horizontal X-Axis */}
          <line
            x1={paddingX}
            y1={paddingY + chartHeight}
            x2={width - paddingX}
            y2={paddingY + chartHeight}
            stroke="currentColor"
            className="text-neutral-300 dark:text-neutral-700"
            strokeWidth={1.5}
          />

          {/* X axis labels */}
          {data.map((dp, i) => {
            const x = paddingX + i * stepX;
            // Draw every 1 or 2 labels depending on width to avoid overcrowding
            const modulo = Math.ceil(pointsCount / 6);
            if (i % modulo !== 0 && i !== pointsCount - 1) return null;

            return (
              <text
                key={i}
                x={x}
                y={paddingY + chartHeight + 16}
                textAnchor="middle"
                fontSize="10"
                className="fill-neutral-400 font-medium"
              >
                {dp.label}
              </text>
            );
          })}

          {/* Dynamic Gradients Definitions */}
          <defs>
            <linearGradient id={`areaGrad-${title.replace(/\s+/g,'')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Dynamic Tooltip overlay */}
        {activeIdx !== null && data[activeIdx] && (
          <div
            className="absolute z-10 pointer-events-none p-2 rounded-lg shadow-md bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold flex flex-col gap-0.5 border border-white/10 dark:border-black/5"
            style={{
              left: Math.max(10, Math.min(width - 130, paddingX + activeIdx * stepX - 60)),
              top: Math.max(4, linePoints[activeIdx]?.y ? linePoints[activeIdx].y - 45 : 10),
            }}
          >
            <span className="opacity-70 font-medium">{data[activeIdx].label}</span>
            <span className="text-sm font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {data[activeIdx].value.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
