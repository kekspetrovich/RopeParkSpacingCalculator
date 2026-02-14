
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
    maxEndGap
  } = config;

  const D = diameter;
  const V = distanceValue;
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
  
  if (distributionMode === 'by-gap' && S > 0) {
    // Optimization: find N that gets us closest to targetGap while keeping G_edge <= M.
    // S = 2*G_edge + N*W + (N-1)*G_inner
    // Assuming G_edge = min(M, targetGap) and G_inner = targetGap:
    // N = (S - 2*G_edge + targetGap) / (targetGap + W)
    const effectiveEdge = Math.min(M, targetGap);
    const nIdeal = (S - 2 * effectiveEdge + targetGap) / (targetGap + W);
    N = Math.max(1, Math.round(nIdeal));
  }

  let actualG_edge = 0;
  let actualG_inner = 0;

  if (S > 0 && N > 0) {
    // Try uniform distribution first
    const Gu = (S - N * W) / (N + 1);
    
    if (Gu <= M + 0.1) {
      actualG_edge = Gu;
      actualG_inner = Gu;
    } else {
      // If uniform exceeds M, fix edges at M
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
  
  if (actualG_edge > M + 0.5) {
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