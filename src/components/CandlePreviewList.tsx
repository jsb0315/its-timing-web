import type { Candle } from '../types/game';
import { GAME_CONFIG } from '../types/game';

interface Props {
  candles: Candle[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function CandlePreviewList({ candles, selectedIndex, onSelect }: Props) {
  const range = GAME_CONFIG.PRICE_RANGE;
  const toPct = (v: number) => ((v - range.min) / (range.max - range.min)) * 100;
  return (
    <div className="flex items-center gap-3 overflow-x-auto p-2">
      {candles.map((c, i) => {
        const isBull: boolean | null = c.close === c.open ? null : c.close > c.open;
        const selected = i === selectedIndex;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(i)}
            className={`shrink-0 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selected ? 'border-bull ring-0' : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ padding: 6 }}
            aria-pressed={selected}
          >
            <div className="h-40 w-12 mx-auto relative flex items-center justify-center">
              {/* 전체 가격 영역 배경 가이드 */}
              <div className="absolute left-1/2 -translate-x-1/2 h-full w-0.5 bg-gray-200" />
              {/* 심지 (저가~고가) */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-0.5"
                style={{
                  top: `${100 - toPct(c.high)}%`,
                  height: `${toPct(c.high) - toPct(c.low)}%`,
                  backgroundColor: '#9CA3AF',
                }}
              />
              {/* 캔들 바디 (시가~종가) */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-6 rounded-sm ${
                  isBull === null ? 'bg-[#9CA3AF]' : isBull ? 'bg-bull' : 'bg-bear'
                }`}
                style={{
                  top: `${100 - toPct(Math.max(c.open, c.close))}%`,
                  height: `${Math.max(2, Math.abs(toPct(c.close) - toPct(c.open)))}%`,
                }}
                title={`O:${c.open} H:${c.high} L:${c.low} C:${c.close}`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
