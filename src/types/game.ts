// Minimal game types for App-level prototyping

export interface Candle {
  id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  x: number;
  targetRange: { min: number; max: number };
}

export const GAME_CONFIG = {
  PRICE_RANGE: { min: 50, max: 150 },
} as const;
