
import React from 'react';
import { AppConfig, CalculationResult } from '../types';
import { formatMm } from '../utils/calculations';

interface MainDiagramProps {
  config: AppConfig;
  result: CalculationResult;
}

export const MainDiagram: React.FC<MainDiagramProps> = ({ config, result }) => {
  const { elementType, boardWidth } = config;
  const { edgeToEdge, elementPositions, firstElementOffset, actualGap } = result;

  // --- FIXED SVG COORDINATE SYSTEM (0-1000 x 0-500) ---
  const viewWidth = 1000;
  const viewHeight = 500;
  const centerY = 250;

  // Horizontal Layout:
  // We reserve fixed space for margins and platform "heads"
  const sideMargin = 80;
  const platformWidth = 50; 
  
  const startX = sideMargin + platformWidth; // Left inner edge of platform
  const endX = viewWidth - sideMargin - platformWidth; // Right inner edge of platform
  
  const usableWidth = endX - startX;
  // Scale maps logical mm to SVG units within the working zone
  const scale = edgeToEdge > 0 ? usableWidth / edgeToEdge : 1;

  // Fixed Visual Sizes (Independent of diameter/scale)
  const platformVisualHeight = 120;
  const elemVisualHeight = 50;
  const platformTop = centerY - platformVisualHeight / 2;
  const platformBottom = centerY + platformVisualHeight / 2;
  const elemTop = centerY - elemVisualHeight / 2;

  /**
   * Renders a dimension line with labels at fixed Y coordinates.
   * Y values are absolute in 0-500 space.
   */
  const renderDimension = (x1: number, x2: number, y: number, label: string, color: string = "#64748b", isBelow = false) => {
    const midX = (x1 + x2) / 2;
    // Keep labels far enough from lines to avoid overlap
    const textYOffset = isBelow ? 28 : -15;
    
    return (
      <g>
        {/* Main horizontal line */}
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="2" />
        {/* Ticks at ends */}
        <line x1={x1} y1={y - 10} x2={x1} y2={y + 10} stroke={color} strokeWidth="2" />
        <line x1={x2} y1={y - 10} x2={x2} y2={y + 10} stroke={color} strokeWidth="2" />
        <text 
          x={midX} 
          y={y + textYOffset} 
          textAnchor="middle" 
          className="font-bold" 
          fill={color}
          style={{ 
            fontSize: '16px', 
            paintOrder: 'stroke', 
            stroke: 'white', 
            strokeWidth: '4px'
          }}
        >
          {label}
        </text>
      </g>
    );
  };

  const hasWidth = elementType !== 'point';

  // Fixed Vertical Slots for Labels (Absolute Y coordinates)
  const yStep = 60;    // Tier 1 Top
  const yOffset = 140; // Tier 2 Top
  const yWidth = 360;  // Tier 1 Bottom
  const yTotal = 440;  // Tier 2 Bottom

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Схема (мм)</h3>
      <div className="w-full overflow-hidden">
        <svg 
          viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
          className="w-full h-auto" 
          style={{ display: 'block', maxWidth: '100%' }}
        >
          {/* Background Reference Axis */}
          <line x1={0} y1={centerY} x2={viewWidth} y2={centerY} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="10,5" />
          
          {/* Left Platform - Fixed shape bulge inward */}
          <path 
            d={`M ${startX - platformWidth},${platformTop} 
               L ${startX - platformWidth},${platformBottom} 
               A ${platformWidth},${platformVisualHeight/2} 0 0 0 ${startX},${centerY}
               A ${platformWidth},${platformVisualHeight/2} 0 0 0 ${startX - platformWidth},${platformTop} Z`} 
            fill="#f8fafc" 
            stroke="#94a3b8" 
            strokeWidth="3" 
          />
          
          {/* Right Platform - Fixed shape bulge inward */}
          <path 
            d={`M ${endX + platformWidth},${platformTop} 
               L ${endX + platformWidth},${platformBottom} 
               A ${platformWidth},${platformVisualHeight/2} 0 0 1 ${endX},${centerY}
               A ${platformWidth},${platformVisualHeight/2} 0 0 1 ${endX + platformWidth},${platformTop} Z`} 
            fill="#f8fafc" 
            stroke="#94a3b8" 
            strokeWidth="3" 
          />

          {/* Working axis line between platforms - Now Black and Thinner */}
          <line x1={startX} y1={centerY} x2={endX} y2={centerY} stroke="#0f172a" strokeWidth="1" strokeDasharray="8,4" />

          {/* Elements - Width scales, Height is constant */}
          {elementPositions.map((pos, idx) => {
            const x = startX + (pos * scale);
            if (elementType === 'point') {
              return <circle key={idx} cx={x} cy={centerY} r="10" fill="#ef4444" stroke="white" strokeWidth="3" />;
            } else {
              const width = boardWidth * scale;
              return <rect key={idx} x={x} y={elemTop} width={width} height={elemVisualHeight} fill="#ef4444" rx="3" stroke="white" strokeWidth="2" />;
            }
          })}

          {/* Dimensions Section - Absolute Y coordinates, Scaled X coordinates */}
          <g>
            {/* Top Tier 1: Step (Gap + Width) */}
            {elementPositions.length > 1 && renderDimension(
              startX + (firstElementOffset + (hasWidth ? boardWidth : 0)) * scale,
              startX + (firstElementOffset + (hasWidth ? boardWidth : 0) + actualGap) * scale,
              yStep, 
              `Шаг: ${formatMm(actualGap)}`,
              "#dc2626"
            )}

            {/* Top Tier 2: Offset (From edge to first element) */}
            {renderDimension(
              startX, 
              startX + (firstElementOffset * scale), 
              yOffset, 
              `Отступ: ${formatMm(firstElementOffset)}`,
              "#2563eb"
            )}

            {/* Bottom Tier 1: Width (Element size) */}
            {hasWidth && elementPositions.length > 0 && renderDimension(
              startX + (firstElementOffset * scale),
              startX + ((firstElementOffset + boardWidth) * scale),
              yWidth,
              `Ширина: ${formatMm(boardWidth)}`,
              "#7c3aed",
              true
            )}

            {/* Bottom Tier 2: Total Working Distance */}
            {renderDimension(
              startX, 
              endX, 
              yTotal, 
              `Всего: ${formatMm(edgeToEdge)} мм`,
              "#0f172a",
              true
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};
