"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

/** PRNG determinístico (mesmo resultado no servidor e no cliente → sem hydration mismatch). */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Decor = {
  left: number;
  top: number;
  size: number;
  type: 0 | 1 | 2; // urso, patinha, coração
  depth: 0 | 1 | 2; // perto, meio, longe
  floatY: number;
  rot: number;
  dur: number;
  delay: number;
};

const COUNT = 24;
const PARALLAX = [14, 8, 4]; // perto, meio, longe

const ITEMS: Decor[] = (() => {
  const rnd = mulberry32(20261121);
  const arr: Decor[] = [];
  for (let i = 0; i < COUNT; i++) {
    const depth = (i % 3) as 0 | 1 | 2;
    const size = depth === 0 ? 40 + rnd() * 18 : depth === 1 ? 28 + rnd() * 12 : 20 + rnd() * 10;
    arr.push({
      left: rnd() * 100,
      top: rnd() * 100,
      size,
      type: (i % 3) as 0 | 1 | 2,
      depth,
      floatY: 6 + rnd() * 4,
      rot: 4 * (rnd() > 0.5 ? 1 : -1),
      dur: 4 + rnd() * 4,
      delay: rnd() * 3,
    });
  }
  return arr;
})();

export default function FloatingDecor() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      const root = rootRef.current!;
      const outers = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".decor"));
      const inners = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".decor-inner"));

      // Flutuação independente (no elemento interno)
      const floats = inners.map((el, i) => {
        const it = ITEMS[i];
        return gsap.to(el, {
          y: it.floatY,
          rotation: it.rot,
          duration: it.dur,
          delay: it.delay,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      // Parallax suavizado (no elemento externo)
      const qx = outers.map((el) =>
        gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" })
      );
      const qy = outers.map((el) =>
        gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" })
      );

      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      function apply(nx: number, ny: number) {
        for (let i = 0; i < outers.length; i++) {
          const p = PARALLAX[ITEMS[i].depth];
          qx[i](p * nx);
          qy[i](p * ny);
        }
      }

      function onOrient(e: DeviceOrientationEvent) {
        const gamma = e.gamma ?? 0; // esquerda/direita
        const beta = e.beta ?? 0; // frente/trás
        apply(clamp(gamma / 25), clamp((beta - 45) / 25));
      }
      function onMouse(e: MouseEvent) {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        apply(nx * 0.6, ny * 0.6); // mais sutil no desktop
      }
      function onVisibility() {
        const hidden = document.visibilityState === "hidden";
        floats.forEach((t) => (hidden ? t.pause() : t.resume()));
      }

      window.addEventListener("mousemove", onMouse);
      document.addEventListener("visibilitychange", onVisibility);

      // iOS 13+ exige permissão, pedida a partir de um toque do usuário.
      const DOE = window.DeviceOrientationEvent as
        | (typeof DeviceOrientationEvent & {
            requestPermission?: () => Promise<"granted" | "denied">;
          })
        | undefined;
      let onFirstTap: (() => void) | null = null;
      if (DOE && typeof DOE.requestPermission === "function") {
        onFirstTap = () => {
          DOE.requestPermission?.()
            .then((r) => {
              if (r === "granted")
                window.addEventListener("deviceorientation", onOrient);
            })
            .catch(() => {});
        };
        window.addEventListener("pointerdown", onFirstTap, { once: true });
      } else if (DOE) {
        window.addEventListener("deviceorientation", onOrient);
      }

      return () => {
        window.removeEventListener("mousemove", onMouse);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("deviceorientation", onOrient);
        if (onFirstTap) window.removeEventListener("pointerdown", onFirstTap);
      };
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="absolute inset-0">
      {ITEMS.map((it, i) => (
        <div
          key={i}
          className="decor absolute"
          style={{
            left: `${it.left}%`,
            top: `${it.top}%`,
            width: it.size,
            height: it.size,
            willChange: "transform",
          }}
        >
          <div className="decor-inner h-full w-full" style={{ willChange: "transform" }}>
            <DecorIcon type={it.type} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DecorIcon({ type }: { type: 0 | 1 | 2 }) {
  if (type === 0) {
    // Ursinho
    return (
      <svg viewBox="0 0 30 30" className="h-full w-full" fill="#A6805C" opacity={0.18}>
        <circle cx="7" cy="7" r="5" />
        <circle cx="23" cy="7" r="5" />
        <circle cx="15" cy="17" r="11" />
      </svg>
    );
  }
  if (type === 1) {
    // Patinha
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="#A6805C" opacity={0.16}>
        <ellipse cx="12" cy="15" rx="8" ry="9" />
        <circle cx="4" cy="6" r="2.6" />
        <circle cx="12" cy="3" r="2.6" />
        <circle cx="20" cy="6" r="2.6" />
      </svg>
    );
  }
  // Coração
  return (
    <svg viewBox="0 0 20 18" className="h-full w-full" fill="#C9A574" opacity={0.4}>
      <path d="M10 18 C10 18 0 11 0 5 C0 1.5 2.5 0 5 0 C7 0 9 1.2 10 3 C11 1.2 13 0 15 0 C17.5 0 20 1.5 20 5 C20 11 10 18 10 18 Z" />
    </svg>
  );
}
