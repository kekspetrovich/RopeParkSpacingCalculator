
import React from 'react';
import { AppConfig, CalculationResult } from '../types';
import { formatMm } from '../utils/calculations';

interface MainDiagramProps {
  config: AppConfig;
  result: CalculationResult;
}

export const MainDiagram: React.FC<MainDiagramProps> = ({ config, result }) => {
  const { diameter, elementType, boardWidth, showDimensions } = config;
  const { edgeToEdge, elementPositions, firstElementOffset, actualGap } = result;

  const padding = 600; 
  const circleRadius = diameter / 2;
  const canvasWidth = edgeToEdge + diameter * 2 + padding * 2;
  const canvasHeight = diameter + padding * 2;

  const viewWidth = 1000;
  const scale = viewWidth / canvasWidth;
  const viewHeight = canvasHeight * scale;

  const renderDimension = (x1: number, x2: number, y: number, label: string, color: string = "#64748b", isBelow = false) => {
    if (!showDimensions) return null;
    const midX = (x1 + x2) / 2;
    const textY = isBelow ? y + 15 : y - 8;
    return (
      <g>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="1" />
        <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} stroke={color} strokeWidth="1" />
        <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} stroke={color} strokeWidth="1" />
        <text x={midX} y={textY} textAnchor="middle" className="text-[10px] font-bold" fill={color}>{label}</text>
      </g>
    );
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-x-auto">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Схема (мм)</h3>
      <div className="min-w-[800px]">
        <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="w-full h-auto">
          {/* Axis */}
          <line x1={0} y1={viewHeight / 2} x2={viewWidth} y2={viewHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="10,5" />
          
          {/* Platforms */}
          <g>
            <circle cx={(padding + circleRadius) * scale} cy={viewHeight / 2} r={circleRadius * scale} fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
            <circle cx={(padding + circleRadius + diameter + edgeToEdge) * scale} cy={viewHeight / 2} r={circleRadius * scale} fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          </g>

          {/* Working line */}
          <line x1={(padding + diameter) * scale} y1={viewHeight / 2} x2={(padding + diameter + edgeToEdge) * scale} y2={viewHeight / 2} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,4" />

          {/* Elements */}
          {elementPositions.map((pos, idx) => {
            const x = (padding + diameter + pos) * scale;
            if (elementType === 'point') {
              return <circle key={idx} cx={x} cy={viewHeight / 2} r="5" fill="#ef4444" stroke="white" strokeWidth="1" />;
            } else {
              const width = boardWidth * scale;
              const height = (diameter / 1.5) * scale;
              return <rect key={idx} x={x} y={viewHeight / 2 - height / 2} width={width} height={height} fill="#ef4444" rx="2" stroke="white" strokeWidth="1" />;
            }
          })}

          {/* Dimensions */}
          {showDimensions && (
            <g>
              {/* Total edge-to-edge */}
              {renderDimension(
                (padding + diameter) * scale, 
                (padding + diameter + edgeToEdge) * scale, 
                viewHeight - 40, 
                `Всего: ${formatMm(edgeToEdge)} мм`,
                "#334155",
                true
              )}

              {/* 1st Offset - Positioned lower than Inner Gap */}
              {renderDimension(
                (padding + diameter) * scale, 
                (padding + diameter + firstElementOffset) * scale, 
                viewHeight / 2 - 35, 
                `Отступ: ${formatMm(firstElementOffset)}`,
                "#3b82f6"
              )}

              {/* Inner Gap - Positioned higher to avoid overlap */}
              {elementPositions.length > 1 && renderDimension(
                (padding + diameter + firstElementOffset + (elementType === 'board' ? boardWidth : 0)) * scale,
                (padding + diameter + firstElementOffset + (elementType === 'board' ? boardWidth : 0) + actualGap) * scale,
                viewHeight / 2 - 70, 
                `Шаг: ${formatMm(actualGap)}`,
                "#ef4444"
              )}

              {/* Dimension for board itself */}
              {elementType === 'board' && elementPositions.length > 0 && renderDimension(
                (padding + diameter + firstElementOffset) * scale,
                (padding + diameter + firstElementOffset + boardWidth) * scale,
                viewHeight / 2 + 50,
                `${formatMm(boardWidth)}`,
                "#94a3b8",
                true
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};