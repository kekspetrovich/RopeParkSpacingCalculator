
import React, { useState, useEffect } from 'react';
import { 
  Circle, 
  ArrowLeftRight, 
  Box, 
  LayoutGrid, 
  AlertTriangle, 
  Settings2, 
  Image as ImageIcon, 
  Share2, 
  Plus, 
  Minus,
  Maximize2,
  Lock,
  Unlock
} from 'lucide-react';
import { AppConfig, ElementType } from './types';
import { calculateLayout } from './utils/calculations';
import { MainDiagram } from './components/MainDiagram';
import { ConstructionRuler } from './components/ConstructionRuler';

const STORAGE_KEY = 'construction_layout_config';

const INITIAL_STATE: AppConfig = {
  diameter: 1500,
  distanceMode: 'center-to-center',
  distanceValue: 12000,
  elementType: 'point',
  boardWidth: 145,
  distributionMode: 'by-gap',
  targetGap: 400,
  elementCount: 5,
  maxEndGap: 300,
  isMaxEndGapLocked: false,
  rulerMarkMode: 'edge',
};

const App: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const hash = window.location.hash.substring(1);
      if (hash) {
        return { ...INITIAL_STATE, ...JSON.parse(decodeURIComponent(hash)) };
      }
    } catch (e) {}
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return INITIAL_STATE;
  });

  const [result, setResult] = useState(calculateLayout(config));

  useEffect(() => {
    const newResult = calculateLayout(config);
    setResult(newResult);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      const configString = JSON.stringify(config);
      const encodedConfig = encodeURIComponent(configString);
      if (window.location.hash !== `#${encodedConfig}`) {
        window.location.hash = encodedConfig;
      }
    } catch (e) {}
  }, [config]);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      // If user manually types a value into maxEndGap, we unlock the mode.
      // We check if maxEndGap is being updated WITHOUT explicitly toggling the lock in the same call.
      if (updates.maxEndGap !== undefined && updates.isMaxEndGapLocked === undefined) {
        next.isMaxEndGapLocked = false;
      }
      return next;
    });
  };

  const deriveWidth = (S: number, G: number, N: number) => {
    if (N <= 0) return 0;
    const W = (S - (N + 1) * G) / N;
    return Math.max(0, Math.round(W));
  };

  const handleTargetGapChange = (value: number) => {
    if (config.elementType === 'calculated') {
      const newWidth = deriveWidth(result.edgeToEdge, value, config.elementCount);
      updateConfig({ targetGap: value, boardWidth: newWidth });
    } else {
      updateConfig({ targetGap: value, distributionMode: 'by-gap' });
    }
  };

  const handleElementCountChange = (value: number) => {
    const newCount = Math.max(0, value);
    if (config.elementType === 'calculated') {
      const newWidth = deriveWidth(result.edgeToEdge, config.targetGap, newCount);
      updateConfig({ elementCount: newCount, boardWidth: newWidth });
    } else {
      const tempConfig = { ...config, elementCount: newCount, distributionMode: 'by-count' as const };
      const tempResult = calculateLayout(tempConfig);
      updateConfig({
        elementCount: newCount,
        distributionMode: 'by-count',
        targetGap: Math.round(tempResult.actualGap)
      });
    }
  };

  const handleAdjustCount = (delta: number) => {
    handleElementCountChange(config.elementCount + delta);
  };

  const handleElementTypeChange = (type: ElementType) => {
    if (type === 'calculated') {
      const newWidth = deriveWidth(result.edgeToEdge, config.targetGap, config.elementCount);
      updateConfig({ elementType: type, boardWidth: newWidth, distributionMode: 'by-count' });
    } else {
      updateConfig({ elementType: type });
    }
  };

  const handleToggleMaxEndGapLock = () => {
    const isNowLocked = !config.isMaxEndGapLocked;
    if (isNowLocked) {
      updateConfig({ 
        isMaxEndGapLocked: true, 
        maxEndGap: config.targetGap 
      });
    } else {
      updateConfig({ isMaxEndGapLocked: false });
    }
  };

  const handleExportImage = async () => {
    const element = document.getElementById('export-container');
    if (!element) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const canvas = await (window as any).html2canvas(element, { scale: 2, backgroundColor: '#f8fafc', logging: false, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `razmetka-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Ошибка при создании изображения.');
    } finally { setIsExporting(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Ссылка скопирована!');
  };

  const inputClasses = "w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm";

  return (
    <div className="min-h-screen pb-20 sm:pb-4 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-blue-600 w-5 h-5" />
            <h1 className="text-base font-bold text-slate-800">Разметка</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Поделиться ссылкой"><Share2 className="w-4 h-4" /></button>
            <button onClick={handleExportImage} disabled={isExporting} className={`${isExporting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors active:scale-95`}>
              <ImageIcon className="w-4 h-4" /> <span>{isExporting ? 'Создание...' : 'В картинку'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-4 no-print">
            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><Circle className="w-3 h-3 text-blue-500" /> Платформа</h2>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[1200, 1500, 1800].map(d => (
                  <button key={d} onClick={() => updateConfig({ diameter: d })} className={`py-1 rounded-md border text-xs font-bold transition-colors ${config.diameter === d ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>{d}</button>
                ))}
              </div>
              <input type="number" value={config.diameter} onChange={(e) => updateConfig({ diameter: Number(e.target.value) })} className={inputClasses} />
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowLeftRight className="w-3 h-3 text-blue-500" /> Расстояние</h2>
              <div className="flex p-1 bg-slate-100 rounded-lg mb-2">
                <button onClick={() => updateConfig({ distanceMode: 'center-to-center' })} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.distanceMode === 'center-to-center' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>По осям</button>
                <button onClick={() => updateConfig({ distanceMode: 'edge-to-edge' })} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.distanceMode === 'edge-to-edge' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Край-Край</button>
              </div>
              <input type="number" value={config.distanceValue} onChange={(e) => updateConfig({ distanceValue: Number(e.target.value) })} className={inputClasses} />
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><Box className="w-3 h-3 text-blue-500" /> Тип элемента</h2>
              <div className="flex p-1 bg-slate-100 rounded-lg mb-3">
                <button onClick={() => handleElementTypeChange('point')} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'point' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Точка</button>
                <button onClick={() => handleElementTypeChange('board')} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'board' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Доска</button>
                <button onClick={() => handleElementTypeChange('calculated')} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'calculated' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Рассчитать</button>
              </div>
              {config.elementType !== 'point' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{config.elementType === 'calculated' ? 'Рассчитанная ширина (мм)' : 'Ширина элемента (мм)'}</label>
                  <input 
                    type="number" 
                    value={config.boardWidth} 
                    onChange={(e) => updateConfig({ boardWidth: Number(e.target.value) })} 
                    className={`${inputClasses} ${config.elementType === 'calculated' ? 'bg-blue-50/50 border-blue-200 text-blue-800 cursor-not-allowed' : ''}`}
                    disabled={config.elementType === 'calculated'}
                  />
                  {config.elementType === 'calculated' && <p className="text-[9px] text-blue-500 font-bold italic mt-1">Ширина подбирается автоматически под отступ и количество.</p>}
                </div>
              )}
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><LayoutGrid className="w-3 h-3 text-blue-500" /> Размещение</h2>
              <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                <button 
                  onClick={() => updateConfig({ distributionMode: 'by-gap' })} 
                  disabled={config.elementType === 'calculated'}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'calculated' ? 'opacity-30 cursor-not-allowed' : ''} ${config.distributionMode === 'by-gap' && config.elementType !== 'calculated' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
                >
                  По отступу
                </button>
                <button 
                  onClick={() => updateConfig({ distributionMode: 'by-count' })} 
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.distributionMode === 'by-count' || config.elementType === 'calculated' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
                >
                  По количеству
                </button>
              </div>
              <div className={`mb-4 transition-opacity duration-200 ${config.distributionMode === 'by-gap' || config.elementType === 'calculated' ? 'opacity-100' : 'opacity-60'}`}>
                <label className={`text-[10px] font-bold mb-1 block uppercase transition-colors ${config.distributionMode === 'by-gap' || config.elementType === 'calculated' ? 'text-blue-600' : 'text-slate-500'}`}>Желаемый отступ (мм)</label>
                <input type="number" value={config.targetGap} onChange={(e) => handleTargetGapChange(Number(e.target.value))} className={`${inputClasses} ${config.distributionMode === 'by-gap' || config.elementType === 'calculated' ? 'border-blue-300 ring-2 ring-blue-500/10' : ''}`} />
              </div>
              <div className={`transition-opacity duration-200 ${config.distributionMode === 'by-count' || config.elementType === 'calculated' ? 'opacity-100' : 'opacity-60'}`}>
                <label className={`text-[10px] font-bold mb-1 block uppercase transition-colors ${config.distributionMode === 'by-count' || config.elementType === 'calculated' ? 'text-blue-600' : 'text-slate-500'}`}>Количество элементов</label>
                <div className="flex gap-1 items-center">
                  <button onClick={() => handleAdjustCount(-1)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 active:bg-slate-200 transition-colors shadow-sm"><Minus className="w-4 h-4" /></button>
                  <input type="number" value={config.elementCount} onChange={(e) => handleElementCountChange(Number(e.target.value))} className={`flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center font-bold text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${config.distributionMode === 'by-count' || config.elementType === 'calculated' ? 'border-blue-300 ring-2 ring-blue-500/10' : ''}`} />
                  <button onClick={() => handleAdjustCount(1)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 active:bg-slate-200 transition-colors shadow-sm"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest flex items-center gap-2"><Maximize2 className="w-3 h-3 text-blue-500" /> Макс. отступ (мм)</h2>
                <button 
                  onClick={handleToggleMaxEndGapLock} 
                  className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 ${config.isMaxEndGapLocked ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  {config.isMaxEndGapLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  Как желаемый отступ
                </button>
              </div>
              <input 
                type="number" 
                value={config.isMaxEndGapLocked ? config.targetGap : config.maxEndGap} 
                onChange={(e) => updateConfig({ maxEndGap: Number(e.target.value) })} 
                className={`${inputClasses} ${config.isMaxEndGapLocked ? 'bg-blue-50/50 border-blue-200 text-blue-800' : ''}`} 
              />
              {config.isMaxEndGapLocked && (
                <p className="text-[9px] text-blue-500 font-bold italic mt-1 leading-tight tracking-tight uppercase">Авто-синхронизация с желаемым отступом активна</p>
              )}
            </section>
          </div>

          <div className="lg:col-span-8 space-y-4" id="export-container">
            {result.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm flex gap-3 no-print">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-800 font-bold uppercase leading-tight">
                  {result.warnings.map((w, idx) => <div key={idx}>{w}</div>)}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               <StatBox label="Раб. зона" value={`${Math.round(result.edgeToEdge)}`} unit="мм" />
               <StatBox label="Элементов" value={`${result.elementCount}`} unit="шт" />
               <StatBox label="Между элементами" value={`${Math.round(result.actualGap)}`} unit="мм" highlight />
               <StatBox label="1-й отступ" value={`${Math.round(result.firstElementOffset)}`} unit="мм" />
            </div>
            <MainDiagram config={config} result={result} />
            <ConstructionRuler config={config} result={result} />
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 sm:hidden flex justify-between items-center z-50 no-print shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
         <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Шаг между элементами</span>
            <span className="text-xl font-black text-blue-600 leading-none">{Math.round(result.actualGap)} мм</span>
         </div>
         <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-slate-900 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-transform"><Settings2 className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, unit, highlight = false }: { label: string, value: string, unit?: string, highlight?: boolean }) => (
  <div className={`bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-center ${highlight ? 'ring-2 ring-blue-500/20' : ''}`}>
    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 tracking-tighter">{label}</p>
    <p className={`text-base font-black ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>{value}<span className="text-[10px] ml-0.5 font-normal text-slate-400">{unit}</span></p>
  </div>
);

export default App;
