
import React, { useState, useEffect, useMemo } from 'react';
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
  Unlock,
  Languages
} from 'lucide-react';
import { AppConfig, ElementType, DistanceMode, DistributionMode, RulerMarkMode } from './types';
import { calculateLayout } from './utils/calculations';
import { serializeConfig, deserializeConfig } from './utils/serialization';
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

const TRANSLATIONS = {
  ru: {
    title: 'Разметка',
    platform: 'Платформа',
    distance: 'Расстояние',
    axes: 'По осям',
    edges: 'Край-Край',
    elementType: 'Тип элемента',
    point: 'Точка',
    segment: 'Отрезок',
    calculate: 'Рассчитать',
    segmentWidth: 'Ширина отрезка (мм)',
    calcWidth: 'Рассчитанная ширина (мм)',
    widthAuto: 'Ширина подбирается автоматически под отступ и количество.',
    distribution: 'Размещение',
    byGap: 'По отступу',
    byCount: 'По количеству',
    targetGap: 'Желаемый отступ (мм)',
    elementCount: 'Количество элементов',
    maxEndGap: 'Первый шаг. MAX (мм)',
    syncTarget: 'Как желаемый отступ',
    syncActive: 'Авто-синхронизация активна',
    calcResults: 'Результаты расчета',
    link: 'Ссылка',
    toImage: 'В картинку',
    platformDist: 'От края до края',
    elements: 'Элементов',
    betweenElements: 'Между элементами',
    firstOffset: '1-й отступ',
    mm: 'мм',
    pcs: 'шт',
    creating: 'Создание...',
    stepBetween: 'Шаг между элементами'
  },
  en: {
    title: 'Layout',
    platform: 'Platform',
    distance: 'Distance',
    axes: 'Axes',
    edges: 'Edge-to-Edge',
    elementType: 'Element Type',
    point: 'Point',
    segment: 'Segment',
    calculate: 'Calculate',
    segmentWidth: 'Segment Width (mm)',
    calcWidth: 'Calculated Width (mm)',
    widthAuto: 'Width is auto-adjusted to fit gap and count.',
    distribution: 'Distribution',
    byGap: 'By Gap',
    byCount: 'By Count',
    targetGap: 'Target Gap (mm)',
    elementCount: 'Element Count',
    maxEndGap: '1st Step. MAX (mm)',
    syncTarget: 'Sync with Target',
    syncActive: 'Auto-sync active',
    calcResults: 'Calculation Results',
    link: 'Link',
    toImage: 'To Image',
    platformDist: 'Edge-to-Edge',
    elements: 'Elements',
    betweenElements: 'Between Elements',
    firstOffset: '1st Offset',
    mm: 'mm',
    pcs: 'pcs',
    creating: 'Creating...',
    stepBetween: 'Step between elements'
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'ru' | 'en'>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved === 'en' || saved === 'ru') ? saved : 'ru';
  });

  const t = TRANSLATIONS[lang];
  const [isExporting, setIsExporting] = useState(false);

  const [config, setConfig] = useState<AppConfig>(() => {
    let base = INITIAL_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) base = { ...base, ...JSON.parse(saved) };
    } catch (e) {}

    try {
      const hash = window.location.hash.substring(1);
      if (hash) {
        if (hash.startsWith('v2_')) {
          const deserialized = deserializeConfig(hash);
          if (deserialized) return { ...base, ...deserialized };
        } else {
          return { ...base, ...JSON.parse(decodeURIComponent(hash)) };
        }
      }
    } catch (e) {}
    return base;
  });

  // ВАЖНО: Расчет результата ПРЯМО во время рендера, чтобы избежать устаревших замыканий
  const result = useMemo(() => calculateLayout(config), [config]);

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  // Синхронизация URL и локального хранилища при каждом изменении конфига
  useEffect(() => {
    // Если мы в режиме "по отступу", нужно синхронизировать реальное количество элементов в конфиг
    if (config.distributionMode === 'by-gap' && 
        config.elementType !== 'calculated' && 
        result.elementCount !== config.elementCount) {
      setConfig(prev => ({ ...prev, elementCount: result.elementCount }));
      return; // Дальнейшее выполнение произойдет в следующем цикле эффекта
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      const encodedConfig = serializeConfig(config);
      const newHash = `#${encodedConfig}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    } catch (e) {}
  }, [config, result.elementCount]);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      // Автоматическое переключение режима при изменении параметров
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
      // Предварительный расчет для обновления targetGap при ручном изменении количества
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
    handleElementCountChange(result.elementCount + delta);
  };

  const handleElementTypeChange = (type: ElementType) => {
    if (type === 'calculated') {
      const newWidth = deriveWidth(result.edgeToEdge, config.targetGap, result.elementCount);
      updateConfig({ elementType: type, boardWidth: newWidth, distributionMode: 'by-count', elementCount: result.elementCount });
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
      link.download = `layout-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert(lang === 'ru' ? 'Ошибка при создании изображения.' : 'Export failed.');
    } finally { setIsExporting(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(lang === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
  };

  const inputClasses = "w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm";

  return (
    <div className="min-h-screen pb-20 sm:pb-4 bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4 no-print">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="text-blue-600 w-5 h-5" />
                <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t.title}</h1>
              </div>
              <button 
                onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Languages className="w-3 h-3" />
                {lang.toUpperCase()}
              </button>
            </div>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><Circle className="w-3 h-3 text-blue-500" /> {t.platform}</h2>
              <div className="grid grid-cols-3 gap-2">
                {[1200, 1500, 1800].map(d => (
                  <button key={d} onClick={() => updateConfig({ diameter: d })} className={`py-2 rounded-md border text-xs font-bold transition-colors ${config.diameter === d ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>{d}</button>
                ))}
              </div>
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowLeftRight className="w-3 h-3 text-blue-500" /> {t.distance}</h2>
              <div className="flex p-1 bg-slate-100 rounded-lg mb-2">
                <button onClick={() => updateConfig({ distanceMode: 'center-to-center' })} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.distanceMode === 'center-to-center' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t.axes}</button>
                <button onClick={() => updateConfig({ distanceMode: 'edge-to-edge' })} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.distanceMode === 'edge-to-edge' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t.edges}</button>
              </div>
              <input type="number" value={config.distanceValue} onChange={(e) => updateConfig({ distanceValue: Number(e.target.value) })} className={inputClasses} />
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><Box className="w-3 h-3 text-blue-500" /> {t.elementType}</h2>
              <div className="flex p-1 bg-slate-100 rounded-lg mb-3">
                <button onClick={() => handleElementTypeChange('point')} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'point' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t.point}</button>
                <button onClick={() => handleElementTypeChange('board')} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'board' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t.segment}</button>
                <button onClick={() => handleElementTypeChange('calculated')} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'calculated' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t.calculate}</button>
              </div>
              {config.elementType !== 'point' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{config.elementType === 'calculated' ? t.calcWidth : t.segmentWidth}</label>
                  <input 
                    type="number" 
                    value={config.boardWidth} 
                    onChange={(e) => updateConfig({ boardWidth: Number(e.target.value) })} 
                    className={`${inputClasses} ${config.elementType === 'calculated' ? 'bg-blue-50/50 border-blue-200 text-blue-800 cursor-not-allowed' : ''}`}
                    disabled={config.elementType === 'calculated'}
                  />
                  {config.elementType === 'calculated' && <p className="text-[9px] text-blue-500 font-bold italic mt-1">{t.widthAuto}</p>}
                </div>
              )}
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><LayoutGrid className="w-3 h-3 text-blue-500" /> {t.distribution}</h2>
              <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                <button 
                  onClick={() => updateConfig({ distributionMode: 'by-gap' })} 
                  disabled={config.elementType === 'calculated'}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.elementType === 'calculated' ? 'opacity-30 cursor-not-allowed' : ''} ${config.distributionMode === 'by-gap' && config.elementType !== 'calculated' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
                >
                  {t.byGap}
                </button>
                <button 
                  onClick={() => updateConfig({ distributionMode: 'by-count' })} 
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${config.distributionMode === 'by-count' || config.elementType === 'calculated' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
                >
                  {t.byCount}
                </button>
              </div>
              <div className={`mb-4 transition-opacity duration-200 ${config.distributionMode === 'by-gap' || config.elementType === 'calculated' ? 'opacity-100' : 'opacity-60'}`}>
                <label className={`text-[10px] font-bold mb-1 block uppercase transition-colors ${config.distributionMode === 'by-gap' || config.elementType === 'calculated' ? 'text-blue-600' : 'text-slate-500'}`}>{t.targetGap}</label>
                <input type="number" value={config.targetGap} onChange={(e) => handleTargetGapChange(Number(e.target.value))} className={`${inputClasses} ${config.distributionMode === 'by-gap' || config.elementType === 'calculated' ? 'border-blue-300 ring-2 ring-blue-500/10' : ''}`} />
              </div>
              <div className={`transition-opacity duration-200 ${config.distributionMode === 'by-count' || config.elementType === 'calculated' ? 'opacity-100' : 'opacity-60'}`}>
                <label className={`text-[10px] font-bold mb-1 block uppercase transition-colors ${config.distributionMode === 'by-count' || config.elementType === 'calculated' ? 'text-blue-600' : 'text-slate-500'}`}>{t.elementCount}</label>
                <div className="flex gap-1 items-center">
                  <button onClick={() => handleAdjustCount(-1)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 active:bg-slate-200 transition-colors shadow-sm"><Minus className="w-4 h-4" /></button>
                  <input type="number" value={config.elementCount} onChange={(e) => handleElementCountChange(Number(e.target.value))} className={`flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center font-bold text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${config.distributionMode === 'by-count' || config.elementType === 'calculated' ? 'border-blue-300 ring-2 ring-blue-500/10' : ''}`} />
                  <button onClick={() => handleAdjustCount(1)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 active:bg-slate-200 transition-colors shadow-sm"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </section>

            <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest flex items-center gap-2"><Maximize2 className="w-3 h-3 text-blue-500" /> {t.maxEndGap}</h2>
                <button 
                  onClick={handleToggleMaxEndGapLock} 
                  className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 ${config.isMaxEndGapLocked ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  {config.isMaxEndGapLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  {t.syncTarget}
                </button>
              </div>
              <input 
                type="number" 
                value={config.isMaxEndGapLocked ? config.targetGap : config.maxEndGap} 
                onChange={(e) => updateConfig({ maxEndGap: Number(e.target.value) })} 
                className={`${inputClasses} ${config.isMaxEndGapLocked ? 'bg-blue-50/50 border-blue-200 text-blue-800' : ''}`} 
              />
              {config.isMaxEndGapLocked && (
                <p className="text-[9px] text-blue-500 font-bold italic mt-1 leading-tight tracking-tight uppercase">{t.syncActive}</p>
              )}
            </section>
          </div>

          <div className="lg:col-span-8 space-y-4" id="export-container">
            <div className="flex items-center justify-between no-print px-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.calcResults}</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors active:scale-95" 
                  title={t.link}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t.link}</span>
                </button>
                <button 
                  onClick={handleExportImage} 
                  disabled={isExporting} 
                  className={`${isExporting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-colors active:scale-95`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isExporting ? t.creating : t.toImage}</span>
                </button>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm flex gap-3 no-print">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-800 font-bold uppercase leading-tight">
                  {result.warnings.map((w, idx) => <div key={idx}>{w}</div>)}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               <StatBox label={t.platformDist} value={`${Math.round(result.edgeToEdge)}`} unit={t.mm} />
               <StatBox label={t.elements} value={`${result.elementCount}`} unit={t.pcs} />
               <StatBox label={t.betweenElements} value={`${Math.round(result.actualGap)}`} unit={t.mm} highlight />
               <StatBox label={t.firstOffset} value={`${Math.round(result.firstElementOffset)}`} unit={t.mm} />
            </div>
            
            <MainDiagram config={config} result={result} lang={lang} />
            <ConstructionRuler config={config} result={result} lang={lang} />
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 sm:hidden flex justify-between items-center z-50 no-print shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
         <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{t.stepBetween}</span>
            <span className="text-xl font-black text-blue-600 leading-none">{Math.round(result.actualGap)} {t.mm}</span>
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
