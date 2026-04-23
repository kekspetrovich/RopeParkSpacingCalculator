
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Circle, 
  Box, 
  AlertTriangle, 
  Settings2, 
  Image as ImageIcon, 
  Share2, 
  Plus, 
  Minus,
  Maximize2,
  Lock,
  Unlock,
  Languages,
  Ruler,
  Anchor
} from 'lucide-react';
import { AppConfig, ElementType, DistanceMode } from './types';
import { calculateLayout, formatMm } from './utils/calculations';
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
  fixedTargetGap: false,
  firstOffsetMode: 'manual',
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
    segmentWidth: 'Ширина (мм)',
    calcWidth: 'Рассчитанная ширина',
    widthAuto: 'Авто-подбор ширины',
    distribution: 'Размещение',
    byGap: 'По отступу',
    byCount: 'По количеству',
    targetGap: 'Желаемый отступ (мм)',
    elementCount: 'Количество',
    maxEndGap: 'MAX/Фикс 1-й отступ (мм)',
    syncTarget: 'Синхр.',
    fixOffset: 'Фикс.',
    calcResults: 'Результаты',
    link: 'Ссылка',
    toImage: 'В картинку',
    platformDist: 'Край-Край',
    elements: 'Элементов',
    betweenElements: 'Между элементами',
    firstOffset: '1-й отступ',
    mm: 'мм',
    pcs: 'шт',
    creating: 'Создание...',
    stepBetween: 'Шаг между элементами',
    settings: 'Параметры проекта'
  },
  en: {
    title: 'Layout',
    platform: 'Platform',
    distance: 'Distance',
    axes: 'Axes',
    edges: 'Edge-to-Edge',
    elementType: 'Type',
    point: 'Point',
    segment: 'Segment',
    calculate: 'Calculate',
    segmentWidth: 'Width (mm)',
    calcWidth: 'Calc Width',
    widthAuto: 'Auto width',
    distribution: 'Distribution',
    byGap: 'By Gap',
    byCount: 'By Count',
    targetGap: 'Target Gap (mm)',
    elementCount: 'Count',
    maxEndGap: 'MAX/FIX 1st Gap (mm)',
    syncTarget: 'Sync',
    fixOffset: 'Fix',
    calcResults: 'Results',
    link: 'Link',
    toImage: 'To Image',
    platformDist: 'Edge-to-Edge',
    elements: 'Elements',
    betweenElements: 'Between Elements',
    firstOffset: '1st Offset',
    mm: 'mm',
    pcs: 'pcs',
    creating: 'Creating...',
    stepBetween: 'Step between',
    settings: 'Project Settings'
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
    } catch {
      // Ignore errors
    }

    try {
      const hash = window.location.hash.substring(1);
      if (hash) {
        if (hash.startsWith('v2_') || hash.startsWith('v3_') || hash.startsWith('v4_') || hash.startsWith('v5_') || hash.startsWith('v6_')) {
          const deserialized = deserializeConfig(hash);
          if (deserialized) return { ...base, ...deserialized };
        } else {
          return { ...base, ...JSON.parse(decodeURIComponent(hash)) };
        }
      }
    } catch {
      // Ignore errors
    }
    return base;
  });

  const result = useMemo(() => calculateLayout(config), [config]);

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (config.distributionMode === 'by-gap' && 
        config.elementType !== 'calculated' && 
        result.elementCount !== config.elementCount) {
      setConfig(prev => ({ ...prev, elementCount: result.elementCount }));
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      const encodedConfig = serializeConfig(config);
      const newHash = `#${encodedConfig}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    } catch {
      // Ignore errors
    }
  }, [config, result.elementCount]);

  const deriveWidth = (S: number, G: number, N: number, M: number, isFixed: boolean) => {
    if (N <= 0) return 0;
    // S = N*W + 2*EdgeGap + (N-1)*InnerGap
    const edgeGap = isFixed ? M : G;
    const innerGap = G;
    const W = (S - 2 * edgeGap - (N - 1) * innerGap) / N;
    return Math.max(0, Math.round(W));
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      // Если меняется maxEndGap вручную, переключаем в ручной режим
      if (updates.maxEndGap !== undefined && updates.firstOffsetMode === undefined) {
        next.firstOffsetMode = 'manual';
      }
      return next;
    });
  };

  const handleDiameterChange = (d: number) => {
    if (config.elementType === 'calculated') {
      const tempS = config.distanceMode === 'center-to-center' ? config.distanceValue - d : config.distanceValue;
      const isFixed = config.firstOffsetMode === 'fix';
      const newWidth = deriveWidth(tempS, config.targetGap, config.elementCount, config.maxEndGap, isFixed);
      updateConfig({ diameter: d, boardWidth: newWidth });
    } else {
      updateConfig({ diameter: d });
    }
  };

  const handleDistanceValueChange = (v: number) => {
    if (config.elementType === 'calculated') {
      const tempS = config.distanceMode === 'center-to-center' ? v - config.diameter : v;
      const isFixed = config.firstOffsetMode === 'fix';
      const newWidth = deriveWidth(tempS, config.targetGap, config.elementCount, config.maxEndGap, isFixed);
      updateConfig({ distanceValue: v, boardWidth: newWidth });
    } else {
      updateConfig({ distanceValue: v });
    }
  };

  const handleDistanceModeChange = (mode: DistanceMode) => {
    if (config.elementType === 'calculated') {
      const tempS = mode === 'center-to-center' ? config.distanceValue - config.diameter : config.distanceValue;
      const isFixed = config.firstOffsetMode === 'fix';
      const newWidth = deriveWidth(tempS, config.targetGap, config.elementCount, config.maxEndGap, isFixed);
      updateConfig({ distanceMode: mode, boardWidth: newWidth });
    } else {
      updateConfig({ distanceMode: mode });
    }
  };

  const handleTargetGapChange = (value: number) => {
    if (config.elementType === 'calculated') {
      const isFixed = config.firstOffsetMode === 'fix';
      const newWidth = deriveWidth(result.edgeToEdge, value, config.elementCount, config.maxEndGap, isFixed);
      updateConfig({ targetGap: value, boardWidth: newWidth });
    } else {
      updateConfig({ targetGap: value, distributionMode: 'by-gap' });
    }
  };

  const handleElementCountChange = (value: number) => {
    const newCount = Math.max(0, value);
    if (config.elementType === 'calculated') {
      const isFixed = config.firstOffsetMode === 'fix';
      const newWidth = deriveWidth(result.edgeToEdge, config.targetGap, newCount, config.maxEndGap, isFixed);
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
    handleElementCountChange(result.elementCount + delta);
  };

  const handleElementTypeChange = (type: ElementType) => {
    if (type === 'calculated') {
      const isFixed = config.firstOffsetMode === 'fix';
      const newWidth = deriveWidth(result.edgeToEdge, config.targetGap, result.elementCount, config.maxEndGap, isFixed);
      updateConfig({ elementType: type, boardWidth: newWidth, distributionMode: 'by-count', elementCount: result.elementCount });
    } else {
      updateConfig({ elementType: type });
    }
  };

  const handleToggleFirstOffsetMode = (mode: FirstOffsetMode) => {
    const currentMode = config.firstOffsetMode;
    const nextMode = currentMode === mode ? 'manual' : mode;
    
    const updates: Partial<AppConfig> = { 
      firstOffsetMode: nextMode,
      fixedTargetGap: false // Deactivate target gap fixation if any end gap mode is selected
    };
    
    if (nextMode === 'sync') {
      updates.maxEndGap = config.targetGap;
    } else if (nextMode === 'two-thirds') {
      updates.maxEndGap = Math.round(config.targetGap * 2 / 3);
    }
    
    if (config.elementType === 'calculated') {
      const isFixed = nextMode === 'fix';
      updates.boardWidth = deriveWidth(result.edgeToEdge, config.targetGap, config.elementCount, updates.maxEndGap ?? config.maxEndGap, isFixed);
    }
    
    updateConfig(updates);
  };

  const handleToggleFixedTargetGap = () => {
    setConfig(prev => ({
      ...prev,
      fixedTargetGap: !prev.fixedTargetGap,
      firstOffsetMode: prev.fixedTargetGap ? prev.firstOffsetMode : 'manual'
    }));
  };

  const handleExportImage = async () => {
    const element = document.getElementById('export-container');
    if (!element) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const canvas = await (window as unknown as { html2canvas: (el: HTMLElement, options: object) => Promise<HTMLCanvasElement> }).html2canvas(element, { scale: 2, backgroundColor: '#f8fafc', logging: false, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `layout-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally { setIsExporting(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(lang === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
  };

  const inputContainerClasses = "relative bg-slate-50 border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all";
  const inputBaseClasses = "w-full bg-transparent px-3 py-2 text-base font-normal text-slate-900 outline-none";
  const labelClasses = "block text-[10px] font-normal text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="min-h-screen pb-20 sm:pb-8 bg-slate-50 font-sans text-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-200">
              <Ruler className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-normal text-slate-800 uppercase tracking-tight">{t.title}</h1>
          </div>
          <button 
            onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-normal text-slate-500 hover:bg-slate-50 transition-colors uppercase"
          >
            <Languages className="w-3.5 h-3.5" />
            {lang === 'ru' ? 'RU / EN' : 'EN / RU'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6 no-print">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-normal text-slate-800 uppercase tracking-widest">{t.settings}</h2>
              </div>

              <div className="space-y-5">
                {/* Diameter */}
                <div>
                  <label className={labelClasses}>{t.platform} (Ø мм)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1200, 1500, 1800].map(d => (
                      <button 
                        key={d} 
                        onClick={() => handleDiameterChange(d)} 
                        className={`py-2 rounded-xl border text-xs font-normal transition-all ${config.diameter === d ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance & Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>{t.distance} (мм)</label>
                    <div className={inputContainerClasses}>
                      <input 
                        type="number" 
                        value={config.distanceValue} 
                        onChange={(e) => handleDistanceValueChange(Number(e.target.value))} 
                        className={inputBaseClasses} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Режим</label>
                    <div className="flex p-1 bg-slate-100 rounded-xl h-[42px]">
                      <button onClick={() => handleDistanceModeChange('center-to-center')} className={`flex-1 py-1 rounded-lg text-[10px] font-normal uppercase transition-all ${config.distanceMode === 'center-to-center' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>{t.axes}</button>
                      <button onClick={() => handleDistanceModeChange('edge-to-edge')} className={`flex-1 py-1 rounded-lg text-[10px] font-normal uppercase transition-all ${config.distanceMode === 'edge-to-edge' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>{t.edges}</button>
                    </div>
                  </div>
                </div>

                {/* Element Type */}
                <div>
                  <label className={labelClasses}>{t.elementType}</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                    {[
                      { id: 'point', icon: Circle, label: t.point },
                      { id: 'board', icon: Box, label: t.segment },
                      { id: 'calculated', icon: Maximize2, label: t.calculate }
                    ].map(({ id, icon: Icon, label }) => (
                      <button 
                        key={id} 
                        onClick={() => handleElementTypeChange(id as ElementType)}
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all gap-1.5 ${config.elementType === id ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[9px] font-normal uppercase tracking-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                  {config.elementType === 'calculated' && (
                    <div className="mt-2 px-1">
                       <p className="text-[10px] font-normal text-blue-600 uppercase flex items-center gap-1.5 italic">
                         {t.widthAuto}: {formatMm(config.boardWidth)} {t.mm}
                       </p>
                    </div>
                  )}
                  {config.elementType === 'board' && (
                    <div className="mt-4">
                      <label className={labelClasses}>{t.segmentWidth}</label>
                      <div className={inputContainerClasses}>
                        <input 
                          type="number" 
                          value={config.boardWidth} 
                          onChange={(e) => updateConfig({ boardWidth: Number(e.target.value) })} 
                          className={inputBaseClasses} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5 ml-1">
                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">{t.targetGap}</label>
                        <button 
                          onClick={handleToggleFixedTargetGap}
                          className={`text-[9px] font-normal uppercase px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${config.fixedTargetGap ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                          {config.fixedTargetGap ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                          {t.fixOffset}
                        </button>
                      </div>
                      <div className={inputContainerClasses}>
                        <input 
                          type="number" 
                          value={config.targetGap} 
                          onChange={(e) => handleTargetGapChange(Number(e.target.value))} 
                          className={inputBaseClasses} 
                        />
                      </div>
                    </div>
                    <div>
                    <label className={labelClasses}>{t.elementCount}</label>
                    <div className="flex gap-2">
                      <div className={`${inputContainerClasses} flex-1 flex items-center`}>
                        <button onClick={() => handleAdjustCount(-1)} className="px-2 py-1 text-slate-400 hover:text-blue-600 transition-colors"><Minus className="w-4 h-4" /></button>
                        <input 
                          type="number" 
                          value={config.elementCount} 
                          onChange={(e) => handleElementCountChange(Number(e.target.value))} 
                          className="w-full bg-transparent text-center text-base font-normal text-slate-900 outline-none" 
                        />
                        <button onClick={() => handleAdjustCount(1)} className="px-2 py-1 text-slate-400 hover:text-blue-600 transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Max/Fix End Gap */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">{t.maxEndGap}</label>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleToggleFirstOffsetMode('two-thirds')}
                        className={`text-[9px] font-normal uppercase px-2 py-1 rounded-lg transition-all ${config.firstOffsetMode === 'two-thirds' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        title="2/3"
                      >
                        2/3
                      </button>
                      <button 
                        onClick={() => handleToggleFirstOffsetMode('sync')} 
                        className={`text-[9px] font-normal uppercase px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${config.firstOffsetMode === 'sync' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        title={t.syncTarget}
                      >
                        {config.firstOffsetMode === 'sync' ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                        {t.syncTarget}
                      </button>
                      <button 
                        onClick={() => handleToggleFirstOffsetMode('fix')} 
                        className={`text-[9px] font-normal uppercase px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${config.firstOffsetMode === 'fix' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        title={t.fixOffset}
                      >
                        <Anchor className="w-2.5 h-2.5" />
                        {t.fixOffset}
                      </button>
                    </div>
                  </div>
                  <div className={`${inputContainerClasses} ${config.firstOffsetMode !== 'manual' ? 'bg-slate-100 border-dashed' : ''}`}>
                    <input 
                      type="number" 
                      value={config.firstOffsetMode === 'sync' ? config.targetGap : config.firstOffsetMode === 'two-thirds' ? Math.round(config.targetGap * 2 / 3) : config.maxEndGap} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (config.elementType === 'calculated') {
                           // В режиме Авто-подбора ширины при ручном вводе M нужно пересчитать W
                           const isFixed = config.firstOffsetMode === 'fix';
                           const newWidth = deriveWidth(result.edgeToEdge, config.targetGap, config.elementCount, val, isFixed);
                           updateConfig({ maxEndGap: val, boardWidth: newWidth });
                        } else {
                           updateConfig({ maxEndGap: val });
                        }
                      }} 
                      disabled={config.firstOffsetMode === 'sync' || config.firstOffsetMode === 'two-thirds'}
                      className={`${inputBaseClasses} ${config.firstOffsetMode !== 'manual' ? 'text-slate-400 italic' : ''}`} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleShare} 
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-normal uppercase shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                {t.link}
              </button>
              <button 
                onClick={handleExportImage} 
                disabled={isExporting} 
                className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-[10px] font-normal uppercase shadow-lg transition-all active:scale-95 ${isExporting ? 'bg-slate-400 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                <ImageIcon className="w-4 h-4" />
                {isExporting ? t.creating : t.toImage}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6" id="export-container">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               <StatBox label={t.platformDist} value={`${Math.round(result.edgeToEdge)}`} unit={t.mm} />
               <StatBox label={t.elements} value={`${result.elementCount}`} unit={t.pcs} />
               <StatBox label={t.betweenElements} value={`${Math.round(result.actualGap)}`} unit={t.mm} highlight />
               <StatBox label={t.firstOffset} value={`${Math.round(result.firstElementOffset)}`} unit={t.mm} />
            </div>

            {result.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex gap-4 no-print">
                <div className="bg-amber-100 p-1.5 rounded-lg h-fit"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /></div>
                <div className="text-[11px] text-amber-900 font-normal uppercase leading-tight tracking-tight">
                  {result.warnings.map((w, idx) => <div key={idx} className="mb-1">• {w}</div>)}
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <MainDiagram config={config} result={result} lang={lang} />
              <ConstructionRuler config={config} result={result} lang={lang} />
            </div>
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 sm:hidden flex justify-between items-center z-50 no-print shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
         <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-tight">{t.stepBetween}</span>
            <span className="text-xl font-normal text-blue-600 leading-none">{Math.round(result.actualGap)} {t.mm}</span>
         </div>
         <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-xl shadow-blue-200 active:scale-90 transition-transform"
         >
          <Settings2 className="w-5 h-5" />
         </button>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, unit, highlight = false }: { label: string, value: string, unit?: string, highlight?: boolean }) => (
  <div className={`bg-white p-4 rounded-2xl shadow-sm border ${highlight ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200'} text-center transition-all`}>
    <p className="text-[9px] font-normal text-slate-400 uppercase mb-1 tracking-widest leading-none">{label}</p>
    <div className="flex items-baseline justify-center gap-0.5">
      <span className={`text-lg font-normal ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>{value}</span>
      <span className="text-[10px] font-medium text-slate-400 uppercase">{unit}</span>
    </div>
  </div>
);

export default App;
