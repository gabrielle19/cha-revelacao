"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Conteúdo revelado por baixo da camada dourada. */
  children: React.ReactNode;
  /** Já revelado (visitante que voltou) — mostra sem camada. */
  revealed?: boolean;
  /** Enquanto true, não dá para raspar (ex.: resultado carregando). */
  disabled?: boolean;
  /** Chamado quando ~55% foi raspado (ou revelado sem raspar). */
  onReveal: () => void;
  height?: number;
};

const THRESHOLD = 0.55;
const BRUSH = 22;

export default function ScratchCard({
  children,
  revealed = false,
  disabled = false,
  onReveal,
  height = 168,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const lastCheck = useRef(0);
  const firedRef = useRef(false);
  const [cleared, setCleared] = useState(revealed);

  // Desenha a camada dourada
  useEffect(() => {
    if (revealed) {
      setCleared(true);
      return;
    }
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Degradê dourado
    const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    grad.addColorStop(0, "#E2C48F");
    grad.addColorStop(0.5, "#C9A06A");
    grad.addColorStop(1, "#A67C4E");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Brilho sutil
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.04 + Math.random() * 0.06;
      ctx.fillStyle = "#FBF6EE";
      const r = 6 + Math.random() * 16;
      ctx.beginPath();
      ctx.arc(Math.random() * rect.width, Math.random() * rect.height, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Estrelinha + texto "Raspe aqui"
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    drawSparkle(ctx, cx, cy - 20, 9);
    ctx.fillStyle = "#FBF6EE";
    ctx.font =
      "600 17px Quicksand, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Raspe aqui", cx, cy + 12);
  }, [revealed]);

  function pointerPos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function scratchTo(p: { x: number; y: number }) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = BRUSH * 2;
    ctx.beginPath();
    const from = last.current ?? p;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, BRUSH, 0, Math.PI * 2);
    ctx.fill();
    last.current = p;
  }

  function maybeCheck() {
    const now = Date.now();
    if (now - lastCheck.current < 150) return;
    lastCheck.current = now;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    // Amostra 1 a cada 16 pixels (índice de alpha = i*4 + 3)
    for (let i = 0; i < data.length; i += 4 * 16) {
      total++;
      if (data[i + 3] < 128) clear++;
    }
    if (total > 0 && clear / total >= THRESHOLD) reveal();
  }

  function reveal() {
    if (firedRef.current) return;
    firedRef.current = true;
    setCleared(true);
    onReveal();
  }

  function onPointerDown(e: React.PointerEvent) {
    if (disabled || cleared) return;
    drawing.current = true;
    last.current = null;
    canvasRef.current?.setPointerCapture(e.pointerId);
    scratchTo(pointerPos(e));
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current || disabled || cleared) return;
    scratchTo(pointerPos(e));
    maybeCheck();
  }
  function onPointerUp() {
    drawing.current = false;
    last.current = null;
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-card border-2 border-beige bg-white"
      style={{ height }}
    >
      {/* Conteúdo revelado */}
      <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
        {children}
      </div>

      {/* Camada raspável */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="absolute inset-0 h-full w-full transition-opacity duration-500"
          style={{
            touchAction: "none",
            opacity: cleared ? 0 : 1,
            pointerEvents: cleared || disabled ? "none" : "auto",
            cursor: "pointer",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) {
  ctx.save();
  ctx.fillStyle = "#FBF6EE";
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const radius = i % 2 === 0 ? r : r * 0.4;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
