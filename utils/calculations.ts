
import { AppConfig, CalculationResult } from '../types';

export const calculateLayout = (config: AppConfig): CalculationResult => {
  const {
    diameter,
    distanceMode,
    distanceValue,
    elementType,
    boardWidth,
    distributionMode,
    targetGap,
    elementCount: manualCount,
    maxEndGap,
    firstOffsetMode
  } = config;

  const D = diameter;
  const V = distanceValue;
  const W = elementType === 'point' ? 0 : boardWidth;
  const M = firstOffsetMode === 'two-thirds' ? Math.round(targetGap * 2 / 3) : 
            firstOffsetMode === 'sync' ? targetGap : 
            maxEndGap;

  const isFirstOffsetFixed = firstOffsetMode === 'fix';
  const isMaxEndGapLocked = firstOffsetMode === 'sync' || firstOffsetMode === 'two-thirds';

  let S: number; // Edge-to-edge distance
  let L: number; // Center-to-center distance

  if (distanceMode === 'center-to-center') {
    L = V;
    S = L - D;
  } else {
    S = V;
    L = S + D;
  }

  const warnings: string[] = [];
  if (S < 0) warnings.push('Дистанция слишком мала');

  let N = manualCount;
  
  if (distributionMode === 'by-gap' && S > 0 && elementType !== 'calculated') {
    const effectiveEdge = isMaxEndGapLocked ? targetGap : Math.min(M, targetGap);
    const nIdeal = (S - 2 * effectiveEdge + targetGap) / (targetGap + W);
    N = Math.max(1, Math.round(nIdeal));
  }

  let actualG_edge = 0;
  let actualG_inner = 0;

  if (S > 0 && N > 0) {
    const Gu = (S - N * W) / (N + 1);
    
    if (elementType === 'calculated') {
      // Если включен фиксированный отступ, крайние промежутки равны M, внутренние — targetGap
      if (isFirstOffsetFixed) {
        actualG_edge = M;
        actualG_inner = targetGap;
      } else {
        actualG_edge = targetGap;
        actualG_inner = targetGap;
      }
    } else if (isFirstOffsetFixed) {
      // Режим фиксированного отступа: первый отступ всегда равен M
      actualG_edge = M;
      if (N > 1) {
        actualG_inner = (S - 2 * M - N * W) / (N - 1);
      } else {
        // Если только один элемент, ставим его по центру
        actualG_edge = (S - W) / 2;
        actualG_inner = 0;
      }
    } else if (isMaxEndGapLocked || Gu <= M + 0.1) {
      actualG_edge = Gu;
      actualG_inner = Gu;
    } else {
      actualG_edge = M;
      if (N > 1) {
        actualG_inner = (S - 2 * M - N * W) / (N - 1);
      } else {
        actualG_edge = (S - W) / 2;
        actualG_inner = 0;
      }
    }
  }

  if (actualG_edge < 0 || (N > 1 && actualG_inner < 0)) {
    warnings.push('Элементы не помещаются');
  }
  
  if (!isFirstOffsetFixed && !isMaxEndGapLocked && elementType !== 'calculated' && actualG_edge > M + 0.5) {
    warnings.push(`1-й отступ (${Math.round(actualG_edge)} мм) превышает макс. отступ (${M} мм)`);
  }

  const elementPositions: number[] = [];
  for (let i = 0; i < N; i++) {
    const pos = actualG_edge + i * (W + (N > 1 ? actualG_inner : 0));
    elementPositions.push(pos);
  }

  return {
    edgeToEdge: S,
    centerToCenter: L,
    actualGap: N > 1 ? actualG_inner : actualG_edge,
    elementCount: N,
    firstElementOffset: actualG_edge,
    warnings,
    elementPositions
  };
};

export const formatMm = (val: number): string => {
  return Math.round(val).toString();
};
