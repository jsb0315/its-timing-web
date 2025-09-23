import { useEffect, useMemo, useState } from 'react';
import CandlePreviewList from './components/CandlePreviewList.tsx';
import { Game, GAME_CONFIG } from './game/Game';

function App() {
  const range = GAME_CONFIG.PRICE_RANGE;

  const game = useMemo(() => new Game(), []);
  const [state, setState] = useState(game.getState());

  useEffect(() => {
    return game.subscribe(() => setState(game.getState()));
  }, [game]);

  const selected = state.candles[state.selectedIndex];
  const toPct = (v: number) => ((v - range.min) / (range.max - range.min)) * 100;

  return (
    <div className="min-h-screen w-screen bg-background text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-2xl shadow-lg bg-white p-6 border border-gray-200">
        {/* <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">It&apos;s Timing</h1> */}
        <p className="text-center text-gray-600 mb-6">Candle 객체를 생성하고 프로그래스바(슬라이더)로 OHLC를 제어합니다.</p>

        {/* 콤보 상태 표시 */}
        {selected && selected.comboCount! > 0 && (
          <div className="fixed top-6 right-6 z-50">
            <div className="p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300 rounded-xl shadow-lg">
              <div className="flex items-center justify-center gap-2">
          <span className="text-yellow-800 font-bold text-lg">🔥 COMBO {selected.comboCount}</span>
          <span className="text-yellow-700 text-lg">타겟 레인지 연속 달성!</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 타겟 레인지 달성 여부 표시 */}
        {selected && selected.isInTargetRange && (
          <div className="fixed top-6 right-6 z-50">
            <div className="mb-4 p-2 bg-green-100 border border-green-300 rounded-lg text-center">
              <span className="text-green-800 font-semibold">✅ 타겟 레인지 달성!</span>
            </div>
          </div>
        )}


        {/* 추가/미리보기 */}
        <div className="mb-6 flex-col items-center justify-between gap-4">
          <div className="flex-1">
            <CandlePreviewList
              candles={state.candles}
              selectedIndex={state.selectedIndex}
              onSelect={(idx) => game.setSelectedIndex(idx)}
            />
          </div>
          <div className="ml-2 mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => game.togglePlay()}
              className="px-4 py-2 rounded-md bg-gray-800 text-white font-semibold hover:opacity-90 transition"
            >
              {state.isPlaying ? '정지' : '재생'}
            </button>
            <button
              type="button"
              onClick={() => {
              game.addCandle();
              // DOM 업데이트 후 .scroll 요소를 끝으로 스크롤
              requestAnimationFrame(() => {
                const el = document.querySelector('.scroll') as HTMLElement | null;
                if (el) {
                el.scrollTo?.({ left: el.scrollWidth, behavior: 'smooth' });
                el.scrollLeft = el.scrollWidth; // fallback
                }
              });
              }}
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
              onChange={(e) => game.updateField('open', Number(e.target.value))}
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
              onChange={(e) => game.updateField('close', Number(e.target.value))}
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
              onChange={(e) => game.updateField('high', Number(e.target.value))}
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
              onChange={(e) => game.updateField('low', Number(e.target.value))}
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
              <div className="mb-2">
                <span className="inline-block px-2">O: {selected.open.toFixed(1)}</span>
                <span className="inline-block px-2">H: {selected.high.toFixed(1)}</span>
                <span className="inline-block px-2">L: {selected.low.toFixed(1)}</span>
                <span className="inline-block px-2">C: {selected.close.toFixed(1)}</span>
              </div>
              <div className="text-xs text-gray-500">
                <span className="inline-block px-2">타겟: {selected.targetRange.min.toFixed(1)} ~ {selected.targetRange.max.toFixed(1)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
