
import React, { useState } from 'react';
import { AppConfig, CalculationResult } from '../types';
import { formatMm } from '../utils/calculations';
// Fix: Use correct PascalCase for StretchHorizontal icon import
import { Copy, List, StretchHorizontal as Stretch } from 'lucide-react';

interface ConstructionRulerProps {
  config: AppConfig;
  result: CalculationResult;
  lang: 'ru' | 'en';
}

const LABELS = {
  ru: {
    ruler: 'Линейка разметки',
    platform: 'Платформа',
    element: 'Элемент',
    sequence: 'Последовательность разметки:',
    edge: 'Край платформы',
    copied: 'Последовательность скопирована!',
    hint: '(нажми, чтобы скопировать)',
    column: 'Столбик',
    row: 'Строка'
  },
  en: {
    ruler: 'Marking Ruler',
    platform: 'Platform',
    element: 'Element',
    sequence: 'Marking Sequence:',
    edge: 'Platform Edge',
    copied: 'Sequence copied!',
    hint: '(click to copy)',
    column: 'Column',
    row: 'Row'
  }
};

export const ConstructionRuler: React.FC<ConstructionRulerProps> = ({ config, result, lang }) => {
  const [viewMode, setViewMode] = useState<'column' | 'row'>('column');
  const { elementPositions, edgeToEdge } = result;
  const { elementType, boardWidth } = config;
  const t = LABELS[lang];

  const margin = 50;
  const viewWidth = 1000;
  const viewHeight = 180;
  const usableWidth = viewWidth - (margin * 2);

  const getX = (pos: number) => {
    const ratio = edgeToEdge > 0 ? pos / edgeToEdge : 0;
    return margin + (ratio * usableWidth);
  };

  const hasWidth = elementType !== 'point';

  const sequence = [
    `0 (${t.edge})`,
    ...elementPositions.map(pos => formatMm(pos)),
    `${formatMm(edgeToEdge)} (${t.edge})`
  ];

  const separator = ' | ';
  const fullSequenceText = viewMode === 'column' ? sequence.join('\n') : sequence.join(separator);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSequenceText);
    alert(t.copied);
  };

  const rulerY = viewHeight - 40;
  const tickThickness = 1.5;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.ruler} (мм)</h3>
        <div className="flex gap-4 text-[9px] font-bold uppercase text-slate-500">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> {t.platform}</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-600 rounded-sm"></div> {t.element}</span>
        </div>
      </div>

      <div className="w-full">
        <svg 
          viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
          className="w-full h-auto"
          style={{ display: 'block' }}
        >
          <line 
            x1={margin} 
            y1={rulerY} 
            x2={margin + usableWidth} 
            y2={rulerY} 
            stroke="#0f172a" 
            strokeWidth="1.5" 
          />

          <g>
            <line x1={margin} y1={rulerY - 25} x2={margin} y2={rulerY} stroke="#2563eb" strokeWidth={tickThickness} />
            <text x={margin} y={rulerY + 25} textAnchor="middle" className="text-[14px] font-black" fill="#1d4ed8">0</text>
          </g>

          {elementPositions.map((pos, idx) => {
            const x = getX(pos);
            const isHighDensity = elementPositions.length > 20;
            const labelY = rulerY - 45;
            
            return (
              <g key={idx}>
                <line x1={x} y1={rulerY - 30} x2={x} y2={rulerY} stroke="#dc2626" strokeWidth={tickThickness} />
                
                {hasWidth && (
                  <line 
                    x1={x} 
                    y1={rulerY} 
                    x2={x + (boardWidth / edgeToEdge) * usableWidth} 
                    y2={rulerY} 
                    stroke="#0f172a" 
                    strokeWidth="4" 
                  />
                )}

                <text 
                  x={x} 
                  y={labelY} 
                  textAnchor="start" 
                  className={`${isHighDensity ? 'text-[9px]' : 'text-[12px]'} font-black`} 
                  fill="#0f172a"
                  transform={`rotate(-60, ${x}, ${labelY})`}
                >
                  {formatMm(pos)}
                </text>
              </g>
            );
          })}

          <g>
            <line x1={margin + usableWidth} y1={rulerY - 25} x2={margin + usableWidth} y2={rulerY} stroke="#2563eb" strokeWidth={tickThickness} />
            <text x={margin + usableWidth} y={rulerY + 25} textAnchor="middle" className="text-[14px] font-black" fill="#1d4ed8">{formatMm(edgeToEdge)}</text>
          </g>
        </svg>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">{t.sequence}</p>
            <span className="text-[9px] text-slate-300 font-medium uppercase mt-0.5">{t.hint}</span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg self-start">
            <button 
              onClick={() => setViewMode('column')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${viewMode === 'column' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-3 h-3" />
              {t.column}
            </button>
            <button 
              onClick={() => setViewMode('row')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${viewMode === 'row' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Stretch className="w-3 h-3 rotate-90" />
              {t.row}
            </button>
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className="w-full text-left bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] font-normal text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.99] flex justify-between items-start group max-h-64 overflow-y-auto"
        >
          <div className={`flex ${viewMode === 'column' ? 'flex-col gap-1.5' : 'flex-row flex-wrap gap-x-1.5 gap-y-1'} leading-tight`}>
            {sequence.map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="block">{item}</span>
                {viewMode === 'row' && idx < sequence.length - 1 && (
                  <span className="text-slate-300 font-bold select-none">{separator.trim()}</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <Copy className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 ml-2 mt-0.5 sticky top-0" />
        </button>
      </div>
    </div>
  );
};
