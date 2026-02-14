
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
    isMaxEndGapLocked
  } = config;

  const D = diameter;
  const V = distanceValue;
  // 'calculated' uses boardWidth which is managed by state logic
  const W = elementType === 'point' ? 0 : boardWidth;
  const M = maxEndGap;

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
    // Try uniform distribution first
    const Gu = (S - N * W) / (N + 1);
    
    // For calculated mode, we strictly follow the boardWidth derived in the UI
    if (elementType === 'calculated') {
      actualG_edge = targetGap;
      actualG_inner = targetGap;
    } else if (isMaxEndGapLocked || Gu <= M + 0.1) {
      // If locked, we always use the uniform gap, ignoring the cap M
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
  
  if (!isMaxEndGapLocked && elementType !== 'calculated' && actualG_edge > M + 0.5) {
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
