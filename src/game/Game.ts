import type { Candle } from '../types/Candle';

const PRICE_RANGE = { min: 0, max: 200 } as const;

export const GAME_CONFIG = {
  PRICE_RANGE,
  COMBO_RANGE_PERC: { min: 0.2, max: 0.4 },
  TARGET_RANGE_PERC: { min: 0.2, max: 0.4 },
  TARGET_RANGE_MIN: (PRICE_RANGE.max-PRICE_RANGE.min) * 0.1, // 10% 이내
  RETURN_MAX_PCT: 0.10, // 등락률 최대 절댓값 (±10%)
  RETURN_STD_PCT: 0.03, // 등락률 표준편차 (기본 3%)
} as const;


export type GameState = {
  candles: Candle[];
  selectedIndex: number;
  isPlaying: boolean;
};

export class Game {
  private candles: Candle[] = [];
  private selectedIndex = 0;
  private isPlaying = false;
  private tickId: number | undefined;
  private listeners = new Set<() => void>();

  readonly range = GAME_CONFIG.PRICE_RANGE;

  constructor(initial?: Candle[]) {
    if (initial && initial.length > 0) {
      this.candles = initial.map((c) => ({ ...c }));
    } else {
      const base = 100;
      const init: Candle = {
        id: 1,
        open: base,
        high: 120,
        low: 80,
        close: 105,
        x: 0,
        targetRange: { min: 95, max: 110 },
        isInTargetRange: false,
        comboCount: 0,
      };
      this.candles = [init];
    }
  }

  // Subscription
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitChange() {
    this.listeners.forEach((l) => l());
  }

  getState(): GameState {
    return {
      candles: this.candles.map((c) => ({ ...c })),
      selectedIndex: this.selectedIndex,
      isPlaying: this.isPlaying,
    };
  }

  // Utils
  private clamp(v: number) {
    return Math.min(this.range.max, Math.max(this.range.min, v));
  }

  private isInTargetRange(close: number, targetRange: { min: number; max: number }) {
    return close >= targetRange.min && close <= targetRange.max;
  }

  // 표준정규분포 샘플 (Box-Muller)
  private randn(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // 등락률(%) 샘플: 정규분포를 따르되 ±RETURN_MAX_PCT로 클리핑
  private sampleReturnPct(): number {
    const pct = this.randn() * GAME_CONFIG.RETURN_STD_PCT; // 평균 0, 표준편차 설정값
    const max = GAME_CONFIG.RETURN_MAX_PCT;
    return Math.max(-max, Math.min(max, pct));
  }

  private generateTargetRange(open: number, lastHigh: number, lastLow: number) {
    const variation = GAME_CONFIG.TARGET_RANGE_PERC.min + (GAME_CONFIG.TARGET_RANGE_PERC.max - GAME_CONFIG.TARGET_RANGE_PERC.min) * Math.random() / 2; // 타겟 비율 범위
    const rangeSize = Math.max(GAME_CONFIG.TARGET_RANGE_MIN, lastHigh - lastLow) * variation; // 크기는 이전 범위 비례
    console.log(GAME_CONFIG.TARGET_RANGE_MIN, lastHigh - lastLow, rangeSize, variation)
    const rangeStart = (Math.random() > 0.5 ? variation * open * -1 : variation * open); // 타겟 범위 시작점
    return {
      min: this.clamp(open + rangeStart - rangeSize),
      max: this.clamp(open + rangeStart + rangeSize),
    };
  }

  // Actions
  setSelectedIndex(index: number) {
    if (index < 0 || index >= this.candles.length) return;
    this.selectedIndex = index;
    this.emitChange();
  }

  addCandle() {
    const prev = this.candles;
    const last = prev[prev.length - 1];

    const wasInTarget = this.isInTargetRange(last.close, last.targetRange);
    const currentCombo = wasInTarget ? (last.comboCount || 0) + 1 : 0;

    const base = last.close;
    const open = base;
    const delta = (Math.random() - 0.5) * 50; // [-25, 25]

    let close = this.clamp(open + delta);

    if (wasInTarget && currentCombo > 0) {
      const boostMultiplier = GAME_CONFIG.COMBO_RANGE_PERC.min + (GAME_CONFIG.COMBO_RANGE_PERC.max - GAME_CONFIG.COMBO_RANGE_PERC.min) * Math.random() * (currentCombo); // 20~40% * [1.combo]
      const closeBoost = (last.high - last.low) * boostMultiplier;
      console.log(boostMultiplier, closeBoost)
      close = this.clamp(open + closeBoost + (delta > 0 ? delta : -delta));
    }

    const high = Math.max(open, close);
    const low = Math.min(open, close);

    const id = Date.now();
    const nextCandle: Candle = {
      id,
      open,
      close,
      high,
      low,
      x: 0,
      targetRange: this.generateTargetRange(open, last.high, last.low),
      isInTargetRange: false,
      comboCount: currentCombo,
    };

    // Update previous candle's achieved flag
    if (this.candles.length > 0) {
      const lastIdx = this.candles.length - 1;
      this.candles[lastIdx] = { ...this.candles[lastIdx], isInTargetRange: wasInTarget };
    }
    this.candles = [...this.candles, nextCandle];
    this.selectedIndex = this.candles.length - 1;
    this.emitChange();
  }

  updateField(field: 'open' | 'close' | 'high' | 'low', value: number) {
    const idx = this.selectedIndex;
    if (idx < 0 || idx >= this.candles.length) return;
    const c = { ...this.candles[idx] };
    const val = this.clamp(value);
    if (field === 'open') {
      c.open = val;
      c.high = Math.max(c.high, val, c.close);
      c.low = Math.min(c.low, val, c.close);
    } else if (field === 'close') {
      c.close = val;
      c.high = Math.max(c.high, val, c.open);
      c.low = Math.min(c.low, val, c.open);
    } else if (field === 'high') {
      c.high = this.clamp(Math.max(val, c.open, c.close));
    } else if (field === 'low') {
      c.low = this.clamp(Math.min(val, c.open, c.close));
    }
    const minOC = Math.min(c.open, c.close);
    const maxOC = Math.max(c.open, c.close);
    c.low = Math.min(c.low, minOC);
    c.high = Math.max(c.high, maxOC);

    const next = [...this.candles];
    next[idx] = c;
    this.candles = next;
    this.emitChange();
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    const TICK_MS = 50;
    this.tickId = window.setInterval(() => {
      const idx = this.selectedIndex;
      if (idx < 0 || idx >= this.candles.length) return;
      const next = [...this.candles];
      const c = { ...next[idx] };
      // 등락률: 정규분포(평균 0, 표준편차 설정값) + ±10% 클리핑
      const returnPct = this.sampleReturnPct();
      const delta = c.close * returnPct;
      const newClose = this.clamp(c.close + delta);
      c.close = newClose;
      const minOC = Math.min(c.open, newClose);
      const maxOC = Math.max(c.open, newClose);
      c.low = Math.min(c.low, minOC);
      c.high = Math.max(c.high, maxOC);
      next[idx] = c;
      this.candles = next;
      this.emitChange();
    }, TICK_MS);
    this.emitChange();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.tickId !== undefined) {
      clearInterval(this.tickId);
      this.tickId = undefined;
    }
    this.emitChange();
  }

  togglePlay() {
    if (this.isPlaying) this.stop();
    else this.start();
  }
}

export default Game;
