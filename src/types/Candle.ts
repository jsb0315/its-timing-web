// Minimal game types for App-level prototyping

export interface Candle {
  id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  x: number;
  /**
   * - 레인지 (최소값, 최대값)
   * - 이전 변동폭 비례
   * - 시가의 ±30% 이내
   */
  targetRange: { min: number; max: number };
  isInTargetRange?: boolean;
  comboCount?: number;
}