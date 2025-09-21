import { useCallback, useEffect, useState } from 'react';
import type { Candle } from './types/game';
import { GAME_CONFIG } from './types/game';
import CandlePreviewList from './components/CandlePreviewList.tsx';

function App() {
  const range = GAME_CONFIG.PRICE_RANGE;

  const initial: Candle = {
    id: 1,
    open: 100,
    high: 120,
    low: 80,
    close: 105,
    x: 0,
    targetRange: { min: 95, max: 110 },
  };

  const [candles, setCandles] = useState<Candle[]>([initial]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const clamp = useCallback((v: number) => Math.min(range.max, Math.max(range.min, v)), [range.max, range.min]);

  const addCandle = () => {
    // 새 캔들 추가 시 자동 정지
    // setIsPlaying(false);
    setCandles(prev => {
      const last = prev[prev.length - 1] ?? initial;
      const base = last.close;
      const open = base;
      const delta = (Math.random() - 0.5) * 50; // [-10, 10]
      const close = clamp(open + delta);
      const high = clamp(Math.max(open, close) + Math.random() * 30);
      const low = clamp(Math.min(open, close) - Math.random() * 30);
      const id = Date.now();
      const nextCandle: Candle = {
        id,
        open,
        close,
        high,
        low,
        x: 0,
        targetRange: { min: clamp(open - 5), max: clamp(open + 5) },
      };
      const next = [...prev, nextCandle];
      // 새 캔들 선택
      setSelectedIndex(next.length - 1);
      return next;
    });
  };

  // 재생 루프: 선택된 캔들의 현재가(여기서는 close)를 틱마다 약간 랜덤하게 변동
  useEffect(() => {
    if (!isPlaying) return;
    const TICK_MS = 50;
    const TICK_RANGE = 1 + Math.random() * 10; // 1~10 단위 (range는 clamp 처리)

    const id = window.setInterval(() => {
      setCandles(prev => {
        const idx = selectedIndex;
        if (idx < 0 || idx >= prev.length) return prev;
        const next = [...prev];
        const c = { ...next[idx] };
        const delta = (Math.random() - 0.5) * 2 * TICK_RANGE; // [-5, 5]
        const newClose = clamp(c.close + delta);
        c.close = newClose;
        // high/low 업데이트: open과 close 포함
        const minOC = Math.min(c.open, newClose);
        const maxOC = Math.max(c.open, newClose);
        c.low = Math.min(c.low, minOC);
        c.high = Math.max(c.high, maxOC);
        next[idx] = c;
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [isPlaying, selectedIndex, clamp]);

  const updateField = (field: 'open' | 'close' | 'high' | 'low', value: number) => {
    setCandles((prev: Candle[]) => {
      if (selectedIndex < 0 || selectedIndex >= prev.length) return prev;
      const next = [...prev];
      const c = { ...next[selectedIndex] };
      const val = clamp(value);
      if (field === 'open') {
        c.open = val;
        c.high = Math.max(c.high, val, c.close);
        c.low = Math.min(c.low, val, c.close);
      } else if (field === 'close') {
        c.close = val;
        c.high = Math.max(c.high, val, c.open);
        c.low = Math.min(c.low, val, c.open);
      } else if (field === 'high') {
        c.high = clamp(Math.max(val, c.open, c.close));
      } else if (field === 'low') {
        c.low = clamp(Math.min(val, c.open, c.close));
      }
      // 보정: 항상 low <= min(open, close) <= max(open, close) <= high
      const minOC = Math.min(c.open, c.close);
      const maxOC = Math.max(c.open, c.close);
      c.low = Math.min(c.low, minOC);
      c.high = Math.max(c.high, maxOC);
      next[selectedIndex] = c;
      return next;
    });
  };

  const selected = candles[selectedIndex];
  const toPct = (v: number) => ((v - range.min) / (range.max - range.min)) * 100;

  return (
    <div className="min-h-screen w-screen bg-background text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-2xl shadow-lg bg-white p-6 border border-gray-200">
        {/* <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">It&apos;s Timing</h1> */}
        <p className="text-center text-gray-600 mb-6">Candle 객체를 생성하고 프로그래스바(슬라이더)로 OHLC를 제어합니다.</p>


        {/* 추가/미리보기 */}
        <div className="mb-6 flex-col items-center justify-between gap-4">
          <div className="flex-1">
            <CandlePreviewList
              candles={candles}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />
          </div>
          <div className="ml-2 mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(p => !p)}
              className="px-4 py-2 rounded-md bg-gray-800 text-white font-semibold hover:opacity-90 transition"
            >
              {isPlaying ? '정지' : '재생'}
            </button>
            <button
              type="button"
              onClick={addCandle}
              className="px-4 py-2 rounded-md bg-bull text-white font-semibold hover:opacity-90 transition"
            >
              캔들 추가
            </button>
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="grid gap-5">
          {/* Open */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Open</span>
              <span className="text-sm tabular-nums text-gray-600">{selected?.open.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={0.1}
              value={selected?.open ?? 0}
              onChange={(e) => updateField('open', Number(e.target.value))}
              className="w-full accent-bull"
            />
            <div className="h-2 bg-gray-100 rounded mt-2">
              <div
                className="h-2 rounded bg-bull"
                style={{ width: `${selected ? toPct(selected.open) : 0}%` }}
              />
            </div>
          </div>

          {/* Close */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Close</span>
              <span className="text-sm tabular-nums text-gray-600">{selected?.close.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={0.1}
              value={selected?.close ?? 0}
              onChange={(e) => updateField('close', Number(e.target.value))}
              className="w-full accent-bear"
            />
            <div className="h-2 bg-gray-100 rounded mt-2">
              <div
                className="h-2 rounded bg-bear"
                style={{ width: `${selected ? toPct(selected.close) : 0}%` }}
              />
            </div>
          </div>

          {/* High */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">High</span>
              <span className="text-sm tabular-nums text-gray-600">{selected?.high.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={selected ? Math.max(range.min, Math.max(selected.open, selected.close)) : range.min}
              max={range.max}
              step={0.1}
              value={selected?.high ?? 0}
              onChange={(e) => updateField('high', Number(e.target.value))}
              className="w-full accent-green-600"
            />
            <div className="h-2 bg-gray-100 rounded mt-2">
              <div
                className="h-2 rounded bg-green-600"
                style={{ width: `${selected ? toPct(selected.high) : 0}%` }}
              />
            </div>
          </div>

          {/* Low */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Low</span>
              <span className="text-sm tabular-nums text-gray-600">{selected?.low.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={range.min}
              max={selected ? Math.min(range.max, Math.min(selected.open, selected.close)) : range.max}
              step={0.1}
              value={selected?.low ?? 0}
              onChange={(e) => updateField('low', Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="h-2 bg-gray-100 rounded mt-2">
              <div
                className="h-2 rounded bg-purple-600"
                style={{ width: `${selected ? toPct(selected.low) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* 현재 값 요약 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          {selected && (
            <>
              <span className="inline-block px-2">O: {selected.open.toFixed(1)}</span>
              <span className="inline-block px-2">H: {selected.high.toFixed(1)}</span>
              <span className="inline-block px-2">L: {selected.low.toFixed(1)}</span>
              <span className="inline-block px-2">C: {selected.close.toFixed(1)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
