
export type ElementType = 'point' | 'board' | 'calculated';
export type DistanceMode = 'center-to-center' | 'edge-to-edge';
export type DistributionMode = 'by-gap' | 'by-count';
export type RulerMarkMode = 'center' | 'edge';

export type FirstOffsetMode = 'manual' | 'two-thirds' | 'sync' | 'fix';

export interface AppConfig {
  diameter: number;
  distanceMode: DistanceMode;
  distanceValue: number;
  elementType: ElementType;
  boardWidth: number;
  distributionMode: DistributionMode;
  targetGap: number;
  elementCount: number;
  maxEndGap: number;
  fixedTargetGap: boolean;
  firstOffsetMode: FirstOffsetMode;
  rulerMarkMode: RulerMarkMode;
}

export interface CalculationResult {
  edgeToEdge: number;
  centerToCenter: number;
  actualGap: number;
  elementCount: number;
  firstElementOffset: number;
  warnings: string[];
  elementPositions: number[]; // relative to the inner edge of the first circle
}
