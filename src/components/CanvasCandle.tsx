import { useEffect, useRef } from 'react';
import type { Candle } from '../types/game';
import { GAME_CONFIG } from '../types/game';

interface Props {
  candle: Candle;
  isBull: boolean | null;
  width?: number;
  height?: number;
  showTargetRange?: boolean;
}

// 모던 심플 스타일: 배경/그리드/축 없이 심지와 바디만 렌더링
export default function CanvasCandle({
  candle,
  isBull,
  width = 240,
  height = 200,
  showTargetRange = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 고해상도 스케일
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 심플 배경 (화이트)
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 내부 패딩과 중앙 X
    const pad = 12;
    const padT = pad;
    const padB = pad;
    const padL = pad;
    const padR = pad;
    const drawW = width - padL - padR;
    const drawH = height - padT - padB;
    const cx = Math.round(width / 2) + 0.5;

    // 가격 -> Y 변환
    const toY = (price: number) => {
      const { min, max } = GAME_CONFIG.PRICE_RANGE;
      const t = (price - min) / (max - min);
      return padT + (1 - t) * drawH;
    };

    // target range (선택)
    if (showTargetRange) {
      const yTop = toY(candle.targetRange.max);
      const yBot = toY(candle.targetRange.min);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.18)';
      ctx.fillRect(padL, yTop, drawW, Math.max(2, yBot - yTop));
    }

    // 심지
    const yHigh = toY(candle.high);
    const yLow = toY(candle.low);
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 2; // 조금 더 두껍게
    ctx.beginPath();
    ctx.moveTo(cx, yHigh);
    ctx.lineTo(cx, yLow);
    ctx.stroke();

    // 바디
    const yOpen = toY(candle.open);
    const yClose = toY(candle.close);
    const top = Math.min(yOpen, yClose);
    const bottom = Math.max(yOpen, yClose);
    const bodyH = Math.max(1, bottom - top); // 조금 더 두꺼운 최소값
    const bodyW = 22; // 더 넓은 바디로 모던하게
    const bodyX = Math.round(width / 2 - bodyW / 2) + 0.5;

    const color = isBull === null ? '#9CA3AF' : isBull ? '#F04452' : '#3182F7';
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillRect(bodyX, top, bodyW, bodyH);
    ctx.strokeRect(bodyX, top, bodyW, bodyH);
  }, [candle, isBull, width, height, showTargetRange]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}
