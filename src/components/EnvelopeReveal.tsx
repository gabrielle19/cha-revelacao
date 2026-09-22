"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import BackgroundPattern from "@/components/BackgroundPattern";
import MainPage from "@/components/MainPage";

gsap.registerPlugin(useGSAP);

/**
 * Abertura do convite (GSAP).
 *
 * O "papel" que sai do envelope É a própria página principal (<MainPage />),
 * renderizada uma única vez dentro de `.letter` e reduzida com UMA escala
 * uniforme. O recorte é feito por um container-máscara (`.letter-mask`) preso
 * às bordas do envelope — nada de clip-path calculado. Roda em todo
 * carregamento (sem sessionStorage). FOUC evitado por CSS (visibility hidden)
 * + useGSAP (roda como useLayoutEffect, antes da pintura).
 */

// Caixa do envelope (mesma para todas as camadas), centralizada por margin auto.
const ENV_BOX =
  "env-part absolute inset-0 m-auto w-[min(86vw,340px)] h-[calc(min(86vw,340px)*0.656)]";

// Geometria interna (viewBox 320 x 210). Ponta da aba / centro do selo em 55%.
const TIP_X = 160;
const TIP_Y = 210 * 0.55; // 115.5
const SEAL_R = (320 * 0.24) / 2; // ~38.4

export default function EnvelopeReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLDivElement>(null); // geometria (fundo do envelope)
  const maskRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const flapFrontRef = useRef<HTMLDivElement>(null);
  const flapBackRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const doneRef = useRef(false);

  useGSAP(
    () => {
      const mask = maskRef.current!;
      const letter = letterRef.current!;
      const envParts = gsap.utils.toArray<HTMLElement>(
        rootRef.current!.querySelectorAll(".env-part")
      );

      // Estado final aplicado de forma imperativa (sem re-render React, para não
      // haver "pulo" de 1 frame): a máscara vira tela cheia rolável e o papel
      // volta a tamanho real, sem transform (o fundo volta a ser fixo no scroll).
      const finalize = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        gsap.set(envParts, { display: "none" });
        gsap.set(mask, {
          position: "fixed",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          overflow: "auto",
          zIndex: 10,
        });
        gsap.set(letter, {
          clearProps: "transform,left,top,width",
          borderRadius: 0,
          autoAlpha: 1,
        });
      };

      const prefersReduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReduce) {
        gsap.set(envParts, { display: "none" });
        finalize();
        return;
      }

      const env = envRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = (env.width * 0.88) / vw;

      // Máscara presa às bordas do envelope: laterais/base com 4px de recuo,
      // topo bem acima (para o papel sair pela abertura sem cortar em cima).
      const O = vh; // topo da máscara em -vh; converte Y de tela → Y no papel
      gsap.set(mask, {
        left: env.left + 4,
        top: -vh,
        width: env.width - 8,
        height: env.bottom - 4 - -vh,
        overflow: "hidden",
        zIndex: 2,
      });

      // Papel: largura de tela cheia, centralizado no envelope, escala uniforme.
      // Topo inicial ~20% para dentro do envelope (coberto pela aba fechada).
      const yStart = env.top + env.height * 0.2 + O;
      const yRise = env.top - env.height * 0.55 + O;
      const yFinal = 0 + O;
      gsap.set(letter, {
        left: "50%",
        top: 0,
        xPercent: -50,
        width: vw,
        y: yStart,
        scale: s,
        transformOrigin: "top center",
        borderRadius: 16,
        autoAlpha: 0, // escondido até a subida (reforça o visibility do CSS)
      });

      gsap.set(flapRef.current, {
        transformOrigin: "top center",
        rotateX: 0,
        zIndex: 4,
      });
      gsap.set(sealRef.current, { transformOrigin: "50% 55%" });

      const tl = gsap.timeline({ delay: 0.2, onComplete: finalize });
      tlRef.current = tl;

      // 1. Envelope + selo entram juntos
      tl.from(envParts, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      // 2. Selo salta e cai
      tl.to(sealRef.current, { scale: 1.15, duration: 0.2, ease: "power1.out" });
      tl.to(sealRef.current, {
        y: 40,
        rotation: 15,
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
      });

      // 3. Aba gira para cima. Ao passar de 90°, troca as faces (verso aparece,
      //    frente some) e o z-index — assim o verso claro nunca aparece fechado.
      tl.to(
        flapRef.current,
        { rotateX: 180, duration: 0.7, ease: "power2.inOut" },
        "flap"
      );
      tl.set(flapBackRef.current, { visibility: "visible" }, "flap+=0.35");
      tl.set(flapFrontRef.current, { visibility: "hidden" }, "flap+=0.35");
      tl.set(flapRef.current, { zIndex: 0 }, "flap+=0.35");

      // 4. Papel aparece e sobe de dentro (revelado só agora)
      tl.set(letter, { autoAlpha: 1 }, "rise");
      tl.to(letter, { y: yRise, duration: 0.8, ease: "power3.out" }, "rise");
      tl.add(() => fireConfetti(), "rise+=0.4");

      // 5. Expansão: máscara deixa de cortar; envelope desce e some; papel cresce
      tl.set(mask, { overflow: "visible", zIndex: 10 }, "expand");
      tl.to(
        envParts,
        { y: 120, autoAlpha: 0, duration: 0.6, ease: "power2.in" },
        "expand"
      );
      tl.to(
        letter,
        {
          scale: 1,
          y: yFinal,
          borderRadius: 0,
          duration: 0.8,
          ease: "power2.inOut",
        },
        "expand"
      );
    },
    { scope: rootRef }
  );

  // Se a tela mudar de tamanho durante a animação, pula para o estado final.
  useEffect(() => {
    function onResize() {
      if (!doneRef.current) tlRef.current?.progress(1);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function fireConfetti() {
    try {
      const confetti = (await import("canvas-confetti")).default;
      const colors = ["#FAF6F0", "#E8DCC8", "#C9A574", "#B08968", "#5C4433"];
      const end = Date.now() + 1200;
      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.35 },
          colors,
          scalar: 0.9,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.35 },
          colors,
          scalar: 0.9,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    } catch {
      /* confetti opcional */
    }
  }

  // Tocar em qualquer lugar durante a animação pula direto para a página.
  function handleSkip() {
    if (doneRef.current || !tlRef.current) return;
    tlRef.current.progress(1);
  }

  return (
    <div
      ref={rootRef}
      onClick={handleSkip}
      className="fixed inset-0 z-30 overflow-hidden"
    >
      {/* Fundo ao redor do envelope (mesmo da página) */}
      <BackgroundPattern />

      {/* 1 · Fundo/interior do envelope */}
      <div
        ref={envRef}
        className={ENV_BOX + " rounded-[10px]"}
        style={{
          zIndex: 1,
          background: "#EFE3D1",
          boxShadow: "0 14px 30px -14px rgba(92,68,51,0.45)",
        }}
      />

      {/* 2 · Máscara presa ao envelope, com o papel (página) dentro.
          Posição/tamanho definidos pelo GSAP; visibility hidden no papel evita
          FOUC até a subida. */}
      <div ref={maskRef} className="absolute overflow-hidden">
        <div
          ref={letterRef}
          className="absolute w-screen min-h-[100dvh]"
          style={{ visibility: "hidden" }}
        >
          <BackgroundPattern interactive />
          <MainPage entrance={false} />
        </div>
      </div>

      {/* 3 · Bolso frontal (abas laterais + inferior) */}
      <div
        className={ENV_BOX}
        style={{
          zIndex: 3,
          clipPath: "polygon(0% 0%, 50% 55%, 100% 0%, 100% 100%, 0% 100%)",
          background: "linear-gradient(180deg, #D8C1A0 0%, #CDB491 100%)",
        }}
      >
        <svg
          viewBox="0 0 320 210"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d={`M0 0 L${TIP_X} ${TIP_Y} L320 0 M0 210 L${TIP_X} ${TIP_Y} L320 210`}
            fill="none"
            stroke="#A88B66"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* 4 · Aba superior (gira para cima; duas faces).
          O verso vem ANTES da frente no DOM (se o 3D for achatado pelo fade de
          entrada, a frente é pintada por cima) e começa com visibility:hidden
          (via CSS, desde o SSR) — só aparece quando a aba passa de 90°. */}
      <div
        ref={flapRef}
        className={ENV_BOX}
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "top center",
          willChange: "transform",
          zIndex: 4,
        }}
      >
        {/* Verso (mais claro) */}
        <div
          ref={flapBackRef}
          className="absolute inset-0"
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 50% 55%)",
            background: "#E6D6BF",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            visibility: "hidden",
          }}
        />
        {/* Frente (caramelo) — sempre por cima quando a aba está fechada */}
        <div
          ref={flapFrontRef}
          className="absolute inset-0"
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 50% 55%)",
            background: "linear-gradient(180deg, #E0CBAB 0%, #D3B78F 100%)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(0.1px)",
          }}
        />
      </div>

      {/* 5 · Selo de cera com ursinho, na ponta da aba */}
      <svg
        ref={sealRef}
        className={ENV_BOX}
        viewBox="0 0 320 210"
        style={{ zIndex: 5 }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="wax-g" cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#E2C48F" />
            <stop offset="0.55" stopColor="#C9A06A" />
            <stop offset="1" stopColor="#8A6440" />
          </radialGradient>
        </defs>
        <circle cx={TIP_X} cy={TIP_Y} r={SEAL_R} fill="url(#wax-g)" />
        <circle
          cx={TIP_X}
          cy={TIP_Y}
          r={SEAL_R}
          fill="none"
          stroke="#8A6440"
          strokeWidth="2.4"
          opacity="0.6"
        />
        <circle cx={TIP_X} cy={TIP_Y} r={SEAL_R * 0.68} fill="#8B6F52" />
        <circle
          cx={TIP_X}
          cy={TIP_Y}
          r={SEAL_R * 0.68}
          fill="none"
          stroke="#FAF6F0"
          strokeWidth="1.6"
          strokeDasharray="3 4"
          opacity="0.7"
        />
        <g transform={`translate(${TIP_X - 24},${TIP_Y - 26.4}) scale(0.4)`}>
          <BearHeadInline />
        </g>
      </svg>
    </div>
  );
}

/** Cabeça de urso desenhada em SVG (mesmas cores do BearHead). */
function BearHeadInline() {
  return (
    <g>
      <circle cx="30" cy="34" r="18" fill="#C9A574" />
      <circle cx="90" cy="34" r="18" fill="#C9A574" />
      <circle cx="30" cy="34" r="9" fill="#8B6F52" />
      <circle cx="90" cy="34" r="9" fill="#8B6F52" />
      <circle cx="60" cy="66" r="40" fill="#C9A574" />
      <ellipse cx="60" cy="78" rx="24" ry="19" fill="#FAF6F0" />
      <circle cx="47" cy="60" r="5" fill="#5C4433" />
      <circle cx="73" cy="60" r="5" fill="#5C4433" />
      <circle cx="48.6" cy="58.4" r="1.6" fill="#FFFFFF" />
      <circle cx="74.6" cy="58.4" r="1.6" fill="#FFFFFF" />
      <ellipse cx="60" cy="72" rx="6" ry="4.5" fill="#5C4433" />
      <path
        d="M60 76 v6 M60 82 c-5 6 -13 6 -16 0 M60 82 c5 6 13 6 16 0"
        fill="none"
        stroke="#5C4433"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}
