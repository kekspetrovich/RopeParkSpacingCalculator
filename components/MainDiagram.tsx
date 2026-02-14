
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

  // --- SVG КООРДИНАТЫ (0-1000 x 0-500) ---
  const viewWidth = 1000;
  const viewHeight = 500;
  const centerY = 250;

  const sideMargin = 80;
  const platformWidth = 50; 
  
  const startX = sideMargin + platformWidth; 
  const endX = viewWidth - sideMargin - platformWidth; 
  
  const usableWidth = endX - startX;
  const scale = edgeToEdge > 0 ? usableWidth / edgeToEdge : 1;

  const platformVisualHeight = 120;
  const elemVisualHeight = 50;
  const platformTop = centerY - platformVisualHeight / 2;
  const platformBottom = centerY + platformVisualHeight / 2;
  const elemTop = centerY - elemVisualHeight / 2;

  const renderDimension = (x1: number, x2: number, y: number, label: string, color: string = "#64748b", isBelow = false) => {
    const midX = (x1 + x2) / 2;
    const textYOffset = isBelow ? 32 : -18;
    
    return (
      <g>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="2" />
        <line x1={x1} y1={y - 10} x2={x1} y2={y + 10} stroke={color} strokeWidth="2" />
        <line x1={x2} y1={y - 10} x2={x2} y2={y + 10} stroke={color} strokeWidth="2" />
        <text 
          x={midX} 
          y={y + textYOffset} 
          textAnchor="middle" 
          className="font-normal" 
          fill={color}
          style={{ 
            fontSize: '22px', // Увеличен размер шрифта
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
  const yStep = 90;
  const yOffset = 165;
  const yWidth = 335;
  const yTotal = 410;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.diagram} (мм)</h3>
      </div>
      
      <div className="w-full overflow-hidden">
        <svg 
          viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
          className="w-full h-auto" 
          style={{ display: 'block', maxWidth: '100%' }}
        >
          {/* Базовая ось */}
          <line x1={0} y1={centerY} x2={viewWidth} y2={centerY} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="10,5" />
          
          {/* Левая платформа */}
          <path 
            d={`M ${startX - platformWidth},${platformTop} 
               L ${startX - platformWidth},${platformBottom} 
               A ${platformWidth},${platformVisualHeight/2} 0 0 0 ${startX},${centerY}
               A ${platformWidth},${platformVisualHeight/2} 0 0 0 ${startX - platformWidth},${platformTop} Z`} 
            fill="#f8fafc" 
            stroke="#94a3b8" 
            strokeWidth="3" 
          />
          
          {/* Правая платформа */}
          <path 
            d={`M ${endX + platformWidth},${platformTop} 
               L ${endX + platformWidth},${platformBottom} 
               A ${platformWidth},${platformVisualHeight/2} 0 0 1 ${endX},${centerY}
               A ${platformWidth},${platformVisualHeight/2} 0 0 1 ${endX + platformWidth},${platformTop} Z`} 
            fill="#f8fafc" 
            stroke="#94a3b8" 
            strokeWidth="3" 
          />

          {/* Центральная линия */}
          <line x1={startX} y1={centerY} x2={endX} y2={centerY} stroke="#0f172a" strokeWidth="1" strokeDasharray="8,4" />

          {/* Элементы разметки */}
          {elementPositions.map((pos, idx) => {
            const x = startX + (pos * scale);
            if (elementType === 'point') {
              return <circle key={idx} cx={x} cy={centerY} r="10" fill="#ef4444" stroke="white" strokeWidth="3" />;
            } else {
              const width = boardWidth * scale;
              return <rect key={idx} x={x} y={elemTop} width={width} height={elemVisualHeight} fill="#ef4444" rx="3" stroke="white" strokeWidth="2" />;
            }
          })}

          {/* Размеры */}
          <g>
            {elementPositions.length > 1 && renderDimension(
              startX + (firstElementOffset + (hasWidth ? boardWidth : 0)) * scale,
              startX + (firstElementOffset + (hasWidth ? boardWidth : 0) + actualGap) * scale,
              yStep, 
              `${t.step}: ${formatMm(actualGap)}`,
              "#dc2626"
            )}

            {renderDimension(
              startX, 
              startX + (firstElementOffset * scale), 
              yOffset, 
              `${t.offset}: ${formatMm(firstElementOffset)}`,
              "#2563eb"
            )}

            {hasWidth && elementPositions.length > 0 && renderDimension(
              startX + (firstElementOffset * scale),
              startX + ((firstElementOffset + boardWidth) * scale),
              yWidth,
              `${t.width}: ${formatMm(boardWidth)}`,
              "#7c3aed",
              true
            )}

            {renderDimension(
              startX, 
              endX, 
              yTotal, 
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
