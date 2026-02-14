
import React from 'react';
import { AppConfig, CalculationResult } from '../types';
import { formatMm } from '../utils/calculations';

interface ConstructionRulerProps {
  config: AppConfig;
  result: CalculationResult;
}

export const ConstructionRuler: React.FC<ConstructionRulerProps> = ({ config, result }) => {
  const { elementPositions, edgeToEdge } = result;

  // SVG parameters
  const margin = 50;
  const viewWidth = 1000;
  const viewHeight = 140;
  const usableWidth = viewWidth - (margin * 2);

  const getX = (pos: number) => {
    const ratio = edgeToEdge > 0 ? pos / edgeToEdge : 0;
    return margin + (ratio * usableWidth);
  };

  // Generate the bracketed string sequence
  const sequence = [
    'Край платформы',
    ...elementPositions.map(pos => formatMm(pos)),
    formatMm(edgeToEdge),
    'Край платформы'
  ];

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Линейка разметки (мм)</h3>
        <div className="flex gap-4 text-[9px] font-bold uppercase">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Платформа</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-sm"></div> Элемент</span>
        </div>
      </div>

      <div className="w-full">
        <svg 
          viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
          className="w-full h-auto"
          style={{ display: 'block' }}
        >
          {/* Main ruler line */}
          <line 
            x1={margin} 
            y1={viewHeight - 40} 
            x2={margin + usableWidth} 
            y2={viewHeight - 40} 
            stroke="#e2e8f0" 
            strokeWidth="2" 
          />

          {/* Zero point (First platform edge) */}
          <g>
            <line x1={margin} y1={viewHeight - 60} x2={margin} y2={viewHeight - 40} stroke="#2563eb" strokeWidth="2" />
            <text x={margin} y={viewHeight - 20} textAnchor="middle" className="text-[12px] font-black" fill="#1d4ed8">0</text>
          </g>

          {/* Element marks */}
          {elementPositions.map((pos, idx) => {
            const x = getX(pos);
            // Label offset calculation for high density
            const isHighDensity = elementPositions.length > 20;
            const labelY = viewHeight - 85;
            
            return (
              <g key={idx}>
                <line x1={x} y1={viewHeight - 75} x2={x} y2={viewHeight - 40} stroke="#ef4444" strokeWidth="1.5" />
                <text 
                  x={x} 
                  y={labelY} 
                  textAnchor="start" 
                  className={`${isHighDensity ? 'text-[8px]' : 'text-[10px]'} font-black`} 
                  fill="#0f172a"
                  transform={`rotate(-60, ${x}, ${labelY})`}
                >
                  {formatMm(pos)}
                </text>
              </g>
            );
          })}

          {/* End point (Second platform edge) */}
          <g>
            <line x1={margin + usableWidth} y1={viewHeight - 60} x2={margin + usableWidth} y2={viewHeight - 40} stroke="#2563eb" strokeWidth="2" />
            <text x={margin + usableWidth} y={viewHeight - 20} textAnchor="middle" className="text-[12px] font-black" fill="#1d4ed8">{formatMm(edgeToEdge)}</text>
          </g>
        </svg>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2">Последовательность разметки:</p>
        <div className="flex flex-wrap gap-1">
          {sequence.map((item, idx) => (
            <span key={idx} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] font-black text-slate-800">
              [{item}]
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[9px] text-slate-400 italic text-center">
        * Все размеры указаны от края первой платформы (0 мм). Линейка масштабируется автоматически.
      </p>
    </div>
  );
};
