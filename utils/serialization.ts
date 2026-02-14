
import { AppConfig } from '../types';

const DIAMETER_MAP: Record<number, number> = { 1200: 0, 1500: 1, 1800: 2 };
const DIAMETER_REVERSE: Record<number, number> = { 0: 1200, 1: 1500, 2: 1800 };

// Compact serialization for shorter URLs (v3)
export const serializeConfig = (c: AppConfig): string => {
  const diam = DIAMETER_MAP[c.diameter] ?? 1; // Default to 1500 (1)
  const dm = c.distanceMode === 'center-to-center' ? 0 : 1;
  const et = c.elementType === 'point' ? 0 : c.elementType === 'board' ? 1 : 2;
  const db = c.distributionMode === 'by-gap' ? 0 : 1;
  const lock = c.isMaxEndGapLocked ? 1 : 0;
  const rm = c.rulerMarkMode === 'edge' ? 0 : 1;
  
  // Собираем все важные параметры в строку через нижнее подчеркивание
  return `v3_${diam}_${dm}_${c.distanceValue}_${et}_${c.boardWidth}_${db}_${c.targetGap}_${c.elementCount}_${c.maxEndGap}_${lock}_${rm}`;
};

export const deserializeConfig = (s: string): Partial<AppConfig> | null => {
  if (!s) return null;
  
  // Поддержка v3
  if (s.startsWith('v3_')) {
    const parts = s.split('_');
    if (parts.length < 12) return null;

    const getNum = (val: string, fallback: number) => {
      const n = Number(val);
      return isNaN(n) ? fallback : n;
    };

    return {
      diameter: DIAMETER_REVERSE[getNum(parts[1], 1)] ?? 1500,
      distanceMode: parts[2] === '0' ? 'center-to-center' : 'edge-to-edge',
      distanceValue: getNum(parts[3], 12000),
      elementType: parts[4] === '0' ? 'point' : parts[4] === '1' ? 'board' : 'calculated',
      boardWidth: getNum(parts[5], 145),
      distributionMode: parts[6] === '0' ? 'by-gap' : 'by-count',
      targetGap: getNum(parts[7], 400),
      elementCount: getNum(parts[8], 5),
      maxEndGap: getNum(parts[9], 300),
      isMaxEndGapLocked: parts[10] === '1',
      rulerMarkMode: parts[11] === '0' ? 'edge' : 'center',
    };
  }

  // Поддержка v2 (для совместимости)
  if (s.startsWith('v2_')) {
    const parts = s.split('_');
    const getNum = (val: string, fallback: number) => {
      const n = Number(val);
      return isNaN(n) ? fallback : n;
    };
    return {
      diameter: getNum(parts[1], 1500),
      distanceMode: parts[2] === '0' ? 'center-to-center' : 'edge-to-edge',
      distanceValue: getNum(parts[3], 12000),
      elementType: parts[4] === '0' ? 'point' : parts[4] === '1' ? 'board' : 'calculated',
      boardWidth: getNum(parts[5], 145),
      distributionMode: parts[6] === '0' ? 'by-gap' : 'by-count',
      targetGap: getNum(parts[7], 400),
      elementCount: getNum(parts[8], 5),
      maxEndGap: getNum(parts[9], 300),
      isMaxEndGapLocked: parts[10] === '1',
      rulerMarkMode: parts[11] === '0' ? 'edge' : 'center',
    };
  }

  return null;
};
