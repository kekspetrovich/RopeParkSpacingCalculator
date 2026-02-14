
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
  Maximize2
} from 'lucide-react';
import { AppConfig } from './types';
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
  rulerMarkMode: 'edge',
  showDimensions: true,
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
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleAdjustCount = (delta: number) => {
    updateConfig({
      distributionMode: 'by-count',
      elementCount: Math.max(0, result.elementCount + delta)
    });
  };

  const handleExportImage = async () => {
    const element = document.getElementById('export-container');
    if (!element) return;
    
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const canvas = await (window as any).html2canvas(element, {
        scale: 2,
        backgroundColor: '#f8fafc',
        logging: false,
        useCORS: true
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `razmetka-${Date.now()}.png`;
      link.click();

      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        canvas.toBlob(async (blob: Blob | null) => {
          if (blob) {
            const file = new File([blob], "razmetka.png", { type: 'image/png' });
            try {
              await navigator.share({
                files: [file],
                title: 'Строительная разметка',
                text: 'Схема разметки готова!'
              });
            } catch (err) {
              console.log('Share aborted');
            }
          }
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Ошибка при создании изображения.');
    } finally {
      setIsExporting(false);
    }
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
            <button 
              onClick={handleExportImage} 
              disabled={isExporting}
              className={`${isExporting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors active:scale-95`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>{isExporting ? 'Создание...' : 'В картинку'}</span>
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
              <div className="flex p-1 bg-slate-100 rounded-lg mb-2">
                <button onClick={() => updateConfig({ elementType: 'point' })} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'point' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Точка</button>
                <button onClick={() => updateConfig({ elementType: 'board' })} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'board' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Доска</button>
              </div>
              {config.elementType === 'board' && (
                <input type="number" value={config.boardWidth} onChange={(e) => updateConfig({ boardWidth: Number(e.target.value) })} className={inputClasses} />
              )}
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><LayoutGrid className="w-3 h-3 text-blue-500" /> Размещение</h2>
              <div className="flex p-1 bg-slate-100 rounded-lg mb-3">
                <button onClick={() => updateConfig({ distributionMode: 'by-gap' })} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.distributionMode === 'by-gap' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>По отступу</button>
                <button onClick={() => updateConfig({ distributionMode: 'by-count' })} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.distributionMode === 'by-count' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>По количеству</button>
              </div>
              
              {config.distributionMode === 'by-gap' && (
                <div className="mb-3">
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Желаемый отступ (мм)</label>
                  <input type="number" value={config.targetGap} onChange={(e) => updateConfig({ targetGap: Number(e.target.value) })} className={inputClasses} />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Количество элементов</label>
                <div className="flex gap-1 items-center">
                  <button onClick={() => handleAdjustCount(-1)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 active:bg-slate-200 transition-colors shadow-sm"><Minus className="w-4 h-4" /></button>
                  <input 
                    type="number" 
                    value={result.elementCount} 
                    onChange={(e) => updateConfig({ distributionMode: 'by-count', elementCount: Math.max(0, Number(e.target.value)) })} 
                    className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center font-bold text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                  <button onClick={() => handleAdjustCount(1)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 active:bg-slate-200 transition-colors shadow-sm"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><Maximize2 className="w-3 h-3 text-blue-500" /> Макс. отступ (мм)</h2>
              <input type="number" value={config.maxEndGap} onChange={(e) => updateConfig({ maxEndGap: Number(e.target.value) })} className={inputClasses} />
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
            
            <div className="no-print flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <input type="checkbox" id="showDims" checked={config.showDimensions} onChange={(e) => updateConfig({ showDimensions: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="showDims" className="text-xs text-slate-700 font-bold cursor-pointer select-none">Показывать размеры на схеме</label>
            </div>

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
