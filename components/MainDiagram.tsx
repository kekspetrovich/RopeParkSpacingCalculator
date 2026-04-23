
import React from 'react';
import { AppConfig, CalculationResult } from '../types';
import { formatMm } from '../utils/calculations';

interface MainDiagramProps {
  config: AppConfig;
  result: CalculationResult;
  lang: 'ru' | 'en';
}

const LABELS = {
  ru: {
    step: 'Шаг',
    offset: 'Отступ',
    width: 'Ширина',
    total: 'Всего',
    diagram: 'Схема'
  },
  en: {
    step: 'Step',
    offset: 'Offset',
    width: 'Width',
    total: 'Total',
    diagram: 'Diagram'
  }
};

export const MainDiagram: React.FC<MainDiagramProps> = ({ config, result, lang }) => {
  const { elementType, boardWidth } = config;
  const { edgeToEdge, elementPositions, firstElementOffset, actualGap } = result;
  const t = LABELS[lang];

  // --- SVG КООРДИНАТЫ (0-500 x 0-1000) ---
  // Повернуто на 90 градусов для мобильных устройств
  const viewWidth = 500;
  const viewHeight = 1000;
  const centerX = 250;

  const sideMargin = 80;
  const platformHeight = 50; 
  
  const startY = sideMargin + platformHeight; 
  const endY = viewHeight - sideMargin - platformHeight; 
  
  const usableHeight = endY - startY;
  const scale = edgeToEdge > 0 ? usableHeight / edgeToEdge : 1;

  const platformVisualWidth = 120;
  const elemVisualWidth = 50;
  const platformLeft = centerX - platformVisualWidth / 2;
  const platformRight = centerX + platformVisualWidth / 2;
  const elemLeft = centerX - elemVisualWidth / 2;

  const renderDimension = (y1: number, y2: number, x: number, label: string, color: string = "#64748b", isRight = false) => {
    const midY = (y1 + y2) / 2;
    const textXOffset = isRight ? 32 : -18;
    
    return (
      <g>
        <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth="2" />
        <line x1={x - 10} y1={y1} x2={x + 10} y2={y1} stroke={color} strokeWidth="2" />
        <line x1={x - 10} y1={y2} x2={x + 10} y2={y2} stroke={color} strokeWidth="2" />
        <text 
          x={x + textXOffset} 
          y={midY} 
          textAnchor={isRight ? "start" : "end"} 
          dominantBaseline="middle"
          className="font-normal" 
          fill={color}
          style={{ 
            fontSize: '22px',
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
  const xStep = 90;
  const xOffset = 165;
  const xWidth = 335;
  const xTotal = 410;

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 p-2 relative overflow-hidden flex flex-col">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.diagram} (мм)</h3>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <svg 
          viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
          className="w-full h-full" 
          style={{ display: 'block', maxHeight: '100%' }}
        >
          {/* Базовая ось */}
          <line x1={centerX} y1={0} x2={centerX} y2={viewHeight} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="10,5" />
          
          {/* Верхняя платформа */}
          <path 
            d={`M ${platformLeft},${startY - platformHeight} 
               L ${platformRight},${startY - platformHeight} 
               A ${platformVisualWidth/2},${platformHeight} 0 0 1 ${centerX},${startY}
               A ${platformVisualWidth/2},${platformHeight} 0 0 1 ${platformLeft},${startY - platformHeight} Z`} 
            fill="#f8fafc" 
            stroke="#94a3b8" 
            strokeWidth="3" 
          />
          
          {/* Нижняя платформа */}
          <path 
            d={`M ${platformLeft},${endY + platformHeight} 
               L ${platformRight},${endY + platformHeight} 
               A ${platformVisualWidth/2},${platformHeight} 0 0 0 ${centerX},${endY}
               A ${platformVisualWidth/2},${platformHeight} 0 0 0 ${platformLeft},${endY + platformHeight} Z`} 
            fill="#f8fafc" 
            stroke="#94a3b8" 
            strokeWidth="3" 
          />

          {/* Центральная линия */}
          <line x1={centerX} y1={startY} x2={centerX} y2={endY} stroke="#0f172a" strokeWidth="1" strokeDasharray="8,4" />

          {/* Элементы разметки */}
          {elementPositions.map((pos, idx) => {
            const y = startY + (pos * scale);
            if (elementType === 'point') {
              return <circle key={idx} cx={centerX} cy={y} r="10" fill="#ef4444" stroke="white" strokeWidth="3" />;
            } else {
              const height = boardWidth * scale;
              return <rect key={idx} x={elemLeft} y={y} width={elemVisualWidth} height={height} fill="#ef4444" rx="3" stroke="white" strokeWidth="2" />;
            }
          })}

          {/* Размеры */}
          <g>
            {elementPositions.length > 1 && renderDimension(
              startY + (firstElementOffset + (hasWidth ? boardWidth : 0)) * scale,
              startY + (firstElementOffset + (hasWidth ? boardWidth : 0) + actualGap) * scale,
              xStep, 
              `${t.step}: ${formatMm(actualGap)}`,
              "#dc2626"
            )}

            {renderDimension(
              startY, 
              startY + (firstElementOffset * scale), 
              xOffset, 
              `${t.offset}: ${formatMm(firstElementOffset)}`,
              "#2563eb"
            )}

            {hasWidth && elementPositions.length > 0 && renderDimension(
              startY + (firstElementOffset * scale),
              startY + ((firstElementOffset + boardWidth) * scale),
              xWidth,
              `${t.width}: ${formatMm(boardWidth)}`,
              "#7c3aed",
              true
            )}

            {renderDimension(
              startY, 
              endY, 
              xTotal, 
              `${t.total}: ${formatMm(edgeToEdge)} мм`,
              "#0f172a",
              true
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};
