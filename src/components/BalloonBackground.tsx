"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

/**
 * Fundo contínuo e discreto: balões rosa/azul bebê pastel subindo devagar do
 * rodapé, com balanço lateral suave. Puramente decorativo (atrás do conteúdo,
 * pointer-events none), respeita prefers-reduced-motion. As cores existem só
 * aqui — não mudam a paleta do site.
 */

/** PRNG determinístico → mesmo layout no servidor e no cliente (sem hydration mismatch). */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PINK = { body: "#E8C4CB", edge: "#D3A2AE" };
const BLUE = { body: "#C3D5E3", edge: "#A4BDD1" };
const COUNT = 6;

type Balloon = {
  left: number; // %
  w: number; // px
  pal: { body: string; edge: string };
  dur: number; // s (subida)
  sway: number; // px
  swayDur: number; // s
  rot: number; // deg
  opacity: number;
  startFrac: number; // 0..1 (escalonamento inicial)
};

const ITEMS: Balloon[] = (() => {
  const rnd = mulberry32(20261121);
  return Array.from({ length: COUNT }, (_, i): Balloon => ({
    left: 6 + rnd() * 86,
    w: 22 + rnd() * 16,
    pal: i % 2 === 0 ? PINK : BLUE,
    dur: 15 + rnd() * 9,
    sway: 12 + rnd() * 16,
    swayDur: 3 + rnd() * 2,
    rot: 5 + rnd() * 4,
    opacity: 0.16 + rnd() * 0.12,
    startFrac: rnd(),
  }));
})();

export default function BalloonBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current!;
      const outers = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll(".balloon-rise")
      );
      const inners = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll(".balloon-sway")
      );

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const vh = window.innerHeight;
      const travel = vh + 160;

      if (reduce) {
        // Sem movimento: alguns balões estáticos e discretos espalhados.
        outers.forEach((el, i) =>
          gsap.set(el, { y: (1 - ITEMS[i].startFrac) * vh * 0.8 + 40 })
        );
        return;
      }

      outers.forEach((el, i) => {
        const it = ITEMS[i];
        const t = gsap.fromTo(
          el,
          { y: travel },
          { y: -160, duration: it.dur, ease: "none", repeat: -1 }
        );
        t.time(it.startFrac * it.dur); // escalona a posição inicial
      });

      inners.forEach((el, i) => {
        const it = ITEMS[i];
        gsap.fromTo(
          el,
          { x: -it.sway / 2, rotation: -it.rot / 2 },
          {
            x: it.sway / 2,
            rotation: it.rot / 2,
            duration: it.swayDur,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          }
        );
      });
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        // Fade suave nas bordas: balões surgem embaixo e somem em cima.
        maskImage:
          "linear-gradient(to top, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to top, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
    >
      {ITEMS.map((it, i) => (
        <div
          key={i}
          className="balloon-rise absolute top-0"
          style={{ left: `${it.left}%`, width: it.w, willChange: "transform" }}
        >
          <div className="balloon-sway" style={{ opacity: it.opacity, willChange: "transform" }}>
            <BalloonShape pal={it.pal} w={it.w} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BalloonShape({
  pal,
  w,
}: {
  pal: { body: string; edge: string };
  w: number;
}) {
  const h = Math.round((w * 74) / 44);
  return (
    <svg width={w} height={h} viewBox="0 0 44 74" aria-hidden="true">
      <path
        d="M22 3 C33 3 40 12 40 25 C40 39 30 49 22 51 C14 49 4 39 4 25 C4 12 11 3 22 3 Z"
        fill={pal.body}
      />
      <path d="M22 51 L18 57 L26 57 Z" fill={pal.edge} />
      <path
        d="M22 57 q7 7 0 13 q-7 7 0 13"
        fill="none"
        stroke={pal.edge}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <ellipse cx="15" cy="17" rx="4" ry="7" fill="#FFFFFF" opacity="0.3" />
    </svg>
  );
}
