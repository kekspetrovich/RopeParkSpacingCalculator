
import React from 'react';
import { AppConfig, CalculationResult } from '../types';
import { formatMm } from '../utils/calculations';
import { Copy } from 'lucide-react';

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
    sequence: 'Последовательность разметки (нажми, чтобы скопировать):',
    edge: 'Край платформы',
    copied: 'Последовательность скопирована!'
  },
  en: {
    ruler: 'Marking Ruler',
    platform: 'Platform',
    element: 'Element',
    sequence: 'Marking Sequence (click to copy):',
    edge: 'Platform Edge',
    copied: 'Sequence copied!'
  }
};

export const ConstructionRuler: React.FC<ConstructionRulerProps> = ({ config, result, lang }) => {
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
    `[${t.edge}]`,
    ...elementPositions.map(pos => `[${formatMm(pos)}]`),
    `[${formatMm(edgeToEdge)}]`,
    `[${t.edge}]`
  ];

  const fullSequenceText = sequence.join('');

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
        <div className="flex gap-4 text-[9px] font-bold uppercase">
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
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2">{t.sequence}</p>
        <button 
          onClick={handleCopy}
          className="w-full text-left bg-slate-50 border border-slate-200 p-3 rounded-lg text-[11px] font-black text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.99] flex justify-between items-start group"
        >
          <span className="break-all leading-relaxed">
            {fullSequenceText}
          </span>
          <Copy className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 ml-2 mt-0.5" />
        </button>
      </div>
    </div>
  );
};
