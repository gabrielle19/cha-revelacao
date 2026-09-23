"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP, ensureGsap, SplitText } from "@/lib/gsap-plugins";
import BackgroundPattern from "@/components/BackgroundPattern";
import Bunting from "@/components/Bunting";
import Sparkle from "@/components/Sparkle";
import MainPage, { type MainPageHandle } from "@/components/MainPage";

/**
 * Abertura cinematográfica do convite (GSAP), suave e no tema bebê.
 *
 * O "papel" que sai do envelope É a própria página principal (<MainPage />),
 * renderizada uma única vez dentro de `.letter`, reduzida com UMA escala
 * uniforme e recortada por um container-máscara preso às bordas do envelope.
 *
 * IMPORTANTe para não "mudar a cor" do papel: nada tinge o papel enquanto ele
 * sobe (sem luz deslizante branca, sem sombra sobre o papel) — ele emerge já
 * com a cor final. E o zoom de câmera é limpo por completo no final, senão um
 * transform/will-change residual quebraria o position:fixed da página (e a
 * moldura decorativa).
 */

const ENV_SIZE =
  "absolute inset-0 m-auto w-[min(86vw,340px)] h-[calc(min(86vw,340px)*0.656)]";
const ENV_BOX = "env-part " + ENV_SIZE;

const TIP_X = 160;
const TIP_Y = 210 * 0.55; // 115.5
const SEAL_R = (320 * 0.24) / 2; // ~38.4

// Rachadura do selo (MorphSVG): costura reta fechada → fenda em ziguezague.
const CRACK_CLOSED = "M160 96 L160 100 L160 116 L160 132 L160 136";
const CRACK_OPEN = "M160 80 L150 100 L168 116 L150 132 L162 150";

// Textura de papel (ruído fractal bem sutil, aplicado com multiply).
const PAPER_TEXTURE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.36 0 0 0 0 0.27 0 0 0 0 0.2 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
// Forro interno do envelope (bolinhas caramelo + rosa), visível ao abrir.
const LINER: React.CSSProperties = {
  backgroundColor: "#F4EADB",
  backgroundImage:
    "radial-gradient(circle at 25% 25%, rgba(201,165,116,0.45) 1.4px, transparent 1.9px), radial-gradient(circle at 75% 75%, rgba(232,196,203,0.75) 1.4px, transparent 1.9px)",
  backgroundSize: "14px 14px",
};

const CONFETTI_COLORS = ["#FAF6F0", "#E8DCC8", "#C9A574", "#B08968", "#5C4433"];
// Somente a paleta quente do site (caramelo / marrom / bege claro).
const AMBIENT_COLORS = ["#C9A574", "#B08968", "#D6A96A", "#E0CBAB"];

const HEART = (c: string, s: number) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.5-8.6C1 9.4 3 5.5 6.4 5.5 9 5.5 12 8.4 12 8.4s3-2.9 5.6-2.9C21 5.5 23 9.4 21.5 12.4 19 16.4 12 21 12 21z" fill="${c}"/></svg>`;
const STAR = (c: string, s: number) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2l2.6 6.6 7 .4-5.4 4.6 1.8 6.8L12 23.4 6 20l1.8-6.8L2.4 8.6l7-.4z" fill="${c}"/></svg>`;
const SPARKLE = (c: string, s: number) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 0c.6 6 5.4 10.8 12 11.4C17.4 12 12.6 16.8 12 24c-.6-7.2-5.4-12-12-12.6C6.6 10.8 11.4 6 12 0z" fill="${c}"/></svg>`;
const MOON = (c: string, s: number) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M20 12.6A8 8 0 1 1 11.4 4a6.4 6.4 0 0 0 8.6 8.6z" fill="${c}"/></svg>`;
const CLOUD = (c: string, s: number) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M7 17h10.2a3.4 3.4 0 0 0 .4-6.77A5 5 0 0 0 8.3 8.6 3.8 3.8 0 0 0 7 17z" fill="${c}"/></svg>`;
const AMBIENT_SHAPES = [HEART, STAR, MOON, CLOUD];

// Balões decorativos: rosa e azul bebê pastel — usados SOMENTE aqui (não mexe
// na paleta do site). Tons suaves e sofisticados, nada 3D/neon/saturado.
const BALLOON_PINK = { body: "#E8C4CB", edge: "#D3A2AE" };
const BALLOON_BLUE = { body: "#C3D5E3", edge: "#A4BDD1" };
// Variações mais claras para os buquês que os ursinhos seguram.
const BALLOON_PINK_SOFT = { body: "#F1DADF", edge: "#D9B3BC" };
const BALLOON_BLUE_SOFT = { body: "#DCE7F0", edge: "#AFC5D7" };
// Mistura do "pop": maioria da própria cor + um pouco de creme + um toque da oposta.
const POP_PINK = ["#E8C4CB", "#E8C4CB", "#EFD6DC", "#FAF6F0", "#C3D5E3"];
const POP_BLUE = ["#C3D5E3", "#C3D5E3", "#DBE6EF", "#FAF6F0", "#E8C4CB"];
const DOT = (c: string, s: number) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="${c}"/></svg>`;
const CONFETTI_CURVE = (c: string, s: number) =>
  `<svg width="${s}" height="${s * 0.5}" viewBox="0 0 12 6"><path d="M1 5 Q6 -2 11 5" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

export default function EnvelopeReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null); // câmera (zoom)
  const ambientRef = useRef<HTMLDivElement>(null); // formas flutuantes + bloom
  const envRef = useRef<HTMLDivElement>(null); // geometria (fundo do envelope)
  const maskRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const flapFrontRef = useRef<HTMLDivElement>(null);
  const flapBackRef = useRef<HTMLDivElement>(null);
  const flapShadowRef = useRef<HTMLDivElement>(null); // sombra da aba no bolso
  const glowRef = useRef<HTMLDivElement>(null); // brilho pulsante do selo
  const sealRef = useRef<SVGSVGElement>(null);
  const crackRef = useRef<SVGPathElement>(null);
  const dustRef = useRef<HTMLDivElement>(null); // poeira de luz + faíscas do selo
  const fxLayerRef = useRef<HTMLDivElement>(null); // flash + estilhaços (tela)
  const confettiLayerRef = useRef<HTMLDivElement>(null); // confete (tela)
  const heroRef = useRef<MainPageHandle>(null); // dispara a revelação do hero
  const pinkRef = useRef<HTMLDivElement>(null); // balão rosa (idle + pop)
  const blueRef = useRef<HTMLDivElement>(null); // balão azul (idle + pop)
  const groundRef = useRef<HTMLDivElement>(null); // nuvens do rodapé
  const peekRef = useRef<HTMLDivElement>(null); // ursinho espiando das nuvens
  const buntingRef = useRef<HTMLDivElement>(null); // varal de bandeirinhas (topo)
  const introTextRef = useRef<HTMLDivElement>(null); // título acima do envelope
  const titleRef = useRef<HTMLHeadingElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const underlineRef = useRef<SVGPathElement>(null);

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const loopsRef = useRef<gsap.core.Animation[]>([]);
  const doneRef = useRef(false);
  const reducedRef = useRef(false);
  const acceleratedRef = useRef(false);

  useGSAP(
    () => {
      ensureGsap();

      const mask = maskRef.current!;
      const letter = letterRef.current!;
      const envParts = gsap.utils.toArray<HTMLElement>(
        rootRef.current!.querySelectorAll(".env-part")
      );
      const introParts = gsap.utils.toArray<HTMLElement>(
        rootRef.current!.querySelectorAll(".intro-part")
      );
      const bears = gsap.utils.toArray<HTMLElement>(
        rootRef.current!.querySelectorAll(".bb")
      );

      const small = window.innerWidth < 400;
      const dustCount = small ? 5 : 9;
      const ambientCount = small ? 8 : 14;
      const confettiBase = small ? 18 : 30;

      const killLoops = () => {
        for (const t of loopsRef.current) t.kill();
        loopsRef.current = [];
        for (const box of [
          ambientRef.current,
          dustRef.current,
          fxLayerRef.current,
          confettiLayerRef.current,
        ]) {
          if (box) box.innerHTML = "";
        }
      };

      // Estado final imperativo: máscara vira tela cheia rolável, papel volta ao
      // tamanho real e o zoom de câmera é totalmente limpo (transform + will-change),
      // senão um bloco de contenção residual quebraria o position:fixed do papel
      // e a moldura decorativa (bordas "no meio da página").
      const finalize = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        killLoops();
        gsap.set(sceneRef.current, { clearProps: "transform,willChange" });
        gsap.set([...envParts, ...introParts], { display: "none" });
        gsap.set(mask, {
          position: "fixed",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          overflow: "auto",
          perspective: "none",
          zIndex: 10,
        });
        gsap.set(letter, {
          clearProps: "transform,left,top,width",
          borderRadius: 0,
          autoAlpha: 1,
        });
        // Papel assentou → revela o conteúdo do hero em sequência (via ref,
        // imperativo: não re-renderiza o papel/máscara nem sobrescreve o GSAP).
        requestAnimationFrame(() => heroRef.current?.play());
      };

      reducedRef.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reducedRef.current) {
        gsap.set([...envParts, ...introParts], { display: "none" });
        finalize();
        gsap.set(sceneRef.current, { visibility: "visible" });
        return;
      }

      const env = envRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = (env.width * 0.88) / vw;
      const sealCX = env.left + env.width * 0.5;
      const sealCY = env.top + env.height * 0.55;

      const O = vh;
      gsap.set(mask, {
        left: env.left + 4,
        top: -vh,
        width: env.width - 8,
        height: env.bottom - 4 - -vh,
        overflow: "hidden",
        perspective: 900,
        zIndex: 2,
      });

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
        rotateX: -3, // curvatura mínima de "pergaminho" (não muda a cor)
        transformOrigin: "top center",
        borderRadius: 16,
        autoAlpha: 0,
      });

      // Todas as partes do envelope giram em torno do MESMO centro durante a
      // entrada e a chacoalhada (senão desalinham); a aba volta a girar pela
      // borda superior no instante em que o selo racha.
      gsap.set(envParts, { transformOrigin: "50% 50%" });
      gsap.set(flapRef.current, {
        rotateX: 0,
        zIndex: 4,
      });
      gsap.set(sealRef.current, { transformOrigin: "50% 55%" });
      gsap.set(glowRef.current, { autoAlpha: 0 });
      if (crackRef.current) gsap.set(crackRef.current, { autoAlpha: 0 });

      // ── Loops de ambiente (fase de espera, tudo suave) ──
      startGlow();
      buildRays();
      buildBokeh();
      buildStarfield();
      buildAmbient();
      buildDust();
      buildTwinkles();
      buildBalloons();

      // Telas muito baixas (celular deitado): sem espaço para rodapé/ursinhos.
      const roomy = vh >= 560;
      const ground = groundRef.current;
      const peek = peekRef.current;
      if (!roomy) gsap.set([ground, ...bears], { display: "none" });
      // O varal só cabe acima do título em telas mais altas.
      const bunting = buntingRef.current;
      const tall = vh >= 700;
      if (!tall) gsap.set(bunting, { display: "none" });
      else buildBearLoops();

      const tl = gsap.timeline({ delay: 0.15, onComplete: finalize });
      tlRef.current = tl;

      // 1. Nuvens sobem do rodapé e o envelope "cai" com um balanço macio
      if (roomy) {
        tl.from(ground, { yPercent: 100, duration: 1, ease: "power3.out" }, 0);
      }
      tl.from(
        envParts,
        {
          y: -46,
          rotation: -5,
          opacity: 0,
          duration: 0.9,
          ease: "back.out(1.5)",
        },
        0.1
      );

      // 1b. Varal desce do topo e as bandeirinhas "caem" uma a uma, com um
      //     balanço de mola (o balanço contínuo é CSS, em cada bandeira).
      if (tall && bunting) {
        tl.from(
          bunting,
          { y: -60, autoAlpha: 0, duration: 0.7, ease: "power3.out" },
          0.1
        );
        tl.from(
          bunting.querySelectorAll(".flag-drop"),
          {
            y: -26,
            scale: 0.3,
            autoAlpha: 0,
            transformOrigin: "50% 0%",
            duration: 0.7,
            ease: "back.out(2.6)",
            stagger: { each: 0.05, from: "center" },
          },
          0.35
        );
      }

      // 2. Título: letras saltam uma a uma (SplitText) + sublinhado desenhado
      //    à mão (DrawSVG).
      const split = titleRef.current
        ? SplitText.create(titleRef.current, { type: "words,chars" })
        : null;
      tl.from(
        kickerRef.current,
        { autoAlpha: 0, y: 8, duration: 0.5, ease: "power2.out" },
        0.35
      );
      if (split) {
        tl.from(
          split.chars,
          {
            yPercent: 80,
            autoAlpha: 0,
            rotation: () => gsap.utils.random(-18, 18),
            duration: 0.55,
            ease: "back.out(2.2)",
            stagger: 0.028,
          },
          0.45
        );
      }
      if (underlineRef.current) {
        tl.fromTo(
          underlineRef.current,
          { drawSVG: "0%" },
          { drawSVG: "100%", duration: 0.8, ease: "power2.inOut" },
          0.95
        );
      }

      // 3. Ursinhos segurando balões sobem flutuando do rodapé (MotionPath),
      //    fazendo uma curva em "S" até pararem ao lado do envelope.
      const rise = vh * 0.75;
      if (roomy) {
        bears.forEach((b, i) => {
          const dir = i === 0 ? 1 : -1;
          gsap.set(b, { x: -30 * dir, y: rise });
          tl.to(
            b,
            {
              motionPath: {
                path: [
                  { x: 22 * dir, y: rise * 0.55 },
                  { x: -10 * dir, y: rise * 0.2 },
                  { x: 0, y: 0 },
                ],
                curviness: 1.25,
              },
              duration: 2,
              ease: "sine.out",
            },
            0.35 + i * 0.3
          );
        });
        // Ursinho do meio espia por trás das nuvens.
        tl.fromTo(
          peek,
          { yPercent: 75 },
          { yPercent: 0, duration: 0.6, ease: "back.out(2.4)" },
          1.35
        );
      }

      // 4. Antecipação: o envelope chacoalha (CustomWiggle) e o selo "pulsa"
      tl.addLabel("wiggle", 2.7);
      tl.add(() => {
        gsap.killTweensOf(tl);
        tl.timeScale(1);
      }, "wiggle");
      tl.to(
        introTextRef.current,
        { autoAlpha: 0, y: -6, duration: 0.35, ease: "power1.in" },
        "wiggle"
      );
      tl.to(
        envParts,
        { rotation: 3, duration: 0.7, ease: "envWiggle" },
        "wiggle"
      );
      tl.to(
        sealRef.current,
        {
          scale: 1.12,
          duration: 0.16,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
        },
        "wiggle+=0.5"
      );

      tl.addLabel("crack", "wiggle+=0.78");
      tl.set(flapRef.current, { transformOrigin: "50% 0%" }, "crack");

      // 2. Selo RACHA (Morph), flash suave, estilhaços com física, vibração leve
      if (crackRef.current) {
        tl.set(crackRef.current, { autoAlpha: 1 }, "crack");
        tl.to(
          crackRef.current,
          { morphSVG: CRACK_OPEN, duration: 0.18, ease: "power1.in" },
          "crack"
        );
      }
      tl.add(() => {
        flashSeal();
        spawnShards();
        if ("vibrate" in navigator) navigator.vibrate?.(20);
      }, "crack+=0.1");
      tl.to(
        sealRef.current,
        { autoAlpha: 0, duration: 0.22, ease: "power1.out" },
        "crack+=0.12"
      );
      tl.to(glowRef.current, { autoAlpha: 0, duration: 0.25 }, "crack");

      // 3. Aba abre com "peso" suave (quique leve) + zoom de câmera bem sutil
      tl.addLabel("flap", "crack+=0.3");
      tl.to(
        sceneRef.current,
        { scale: 1.025, duration: 1.5, ease: "sine.inOut" },
        "flap"
      );
      tl.to(
        flapRef.current,
        { rotateX: 180, duration: 0.8, ease: "back.out(1.1)" },
        "flap"
      );
      tl.to(
        flapShadowRef.current,
        { autoAlpha: 0, duration: 0.25, ease: "power1.out" },
        "flap"
      );
      tl.set(flapBackRef.current, { visibility: "visible" }, "flap+=0.4");
      tl.set(flapFrontRef.current, { visibility: "hidden" }, "flap+=0.4");
      tl.set(flapRef.current, { zIndex: 0 }, "flap+=0.4");

      // 3b. Balões fazem um "POP" delicado conforme a aba abre (leve assimetria
      //     de tempo entre os dois), liberando pequenos elementos pastel.
      tl.add(() => popBalloon(pinkRef.current, POP_PINK), "flap+=0.15");
      tl.add(() => popBalloon(blueRef.current, POP_BLUE), "flap+=0.32");

      // 3c. Ursinhos comemoram: o do meio dá um pulinho e os dos balões são
      //     levados para o alto, passando por trás do envelope/papel.
      if (roomy) {
        tl.to(
          peek,
          {
            yPercent: -18,
            duration: 0.22,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          },
          "flap"
        );
        bears.forEach((b, i) => {
          const dir = i === 0 ? 1 : -1;
          tl.to(
            b,
            {
              motionPath: {
                path: [
                  { x: 14 * dir, y: -vh * 0.4 },
                  { x: -8 * dir, y: -vh * 0.8 },
                  { x: 12 * dir, y: -vh * 1.25 },
                ],
                curviness: 1.2,
              },
              duration: 1.7,
              ease: "power1.in",
            },
            `flap+=${0.05 + i * 0.12}`
          );
        });
      }

      // 4. Papel sobe "desenrolando" (rotateX → 0), sem tingir a cor
      tl.addLabel("rise", "flap+=0.5");
      tl.set(letter, { autoAlpha: 1 }, "rise");
      //    Sobe com calma e um leve inclinar (como puxado à mão), já com o
      //    conteúdo aparecendo: nada de papel "em branco" na tela.
      tl.to(
        letter,
        {
          y: yRise,
          rotateX: 0,
          rotation: -1.2,
          duration: 1.15,
          ease: "paperRise",
        },
        "rise"
      );
      tl.add(() => heroRef.current?.play(), "rise+=0.15");
      tl.add(spawnRiseSparkles, "rise+=0.2");
      tl.add(() => fireConfetti(confettiBase), "rise+=0.5");
      // Varal sobe e sai pelo topo, abrindo caminho para o papel.
      if (tall) {
        tl.to(
          bunting,
          { y: -90, autoAlpha: 0, duration: 0.7, ease: "power2.in" },
          "rise"
        );
      }
      // Nuvens (e o ursinho do meio) afundam no rodapé enquanto o papel sobe.
      if (roomy) {
        tl.to(
          ground,
          { yPercent: 100, autoAlpha: 0, duration: 0.8, ease: "power2.in" },
          "rise+=0.1"
        );
      }

      // 5. Expansão: o papel "infla" suavemente até a tela cheia enquanto o
      //    envelope recua e some com delicadeza. Câmera volta ao normal em
      //    sincronia, para uma renderização macia (sem "pulo" nem pressa).
      //    Um respiro com o papel para fora (dá para ler o topo do convite)
      //    antes de crescer.
      tl.addLabel("expand", "rise+=1.05");
      tl.set(mask, { overflow: "visible", zIndex: 10 }, "expand");
      tl.to(
        sceneRef.current,
        { scale: 1, duration: 1.2, ease: "sine.inOut" },
        "expand"
      );
      // Envelope escorrega para baixo e sai de cena, girando de leve.
      tl.to(
        envParts,
        {
          y: vh * 0.4,
          rotation: 5,
          autoAlpha: 0,
          duration: 0.85,
          ease: "power2.in",
        },
        "expand"
      );
      // Papel cresce com uma curva longa e macia, desfazendo a inclinação.
      tl.to(
        letter,
        {
          scale: 1,
          y: yFinal,
          rotateX: 0,
          rotation: 0,
          borderRadius: 0,
          duration: 1.2,
          ease: "power3.inOut",
        },
        "expand"
      );
      // 6. Segunda rajada de confete (leve) quando a expansão termina
      tl.add(() => fireConfetti(Math.round(confettiBase / 2)), "expand+=0.75");

      // Estados iniciais aplicados → só agora a cena aparece (evita o "flash"
      // do HTML do servidor com tudo no lugar final antes da hidratação).
      gsap.set(sceneRef.current, { visibility: "visible" });

      // ────────────────────────── helpers ──────────────────────────

      // Brilhinhos que "escapam" da boca do envelope junto com o papel.
      function spawnRiseSparkles() {
        const box = dustRef.current;
        if (!box || doneRef.current) return;
        const n = small ? 6 : 9;
        for (let i = 0; i < n; i++) {
          const size = gsap.utils.random(8, 13);
          const el = document.createElement("span");
          Object.assign(el.style, {
            position: "absolute",
            left: `${gsap.utils.random(env.left + 12, env.right - 12)}px`,
            top: `${env.top + gsap.utils.random(-6, 10)}px`,
            marginLeft: `${-size / 2}px`,
            pointerEvents: "none",
          } as Partial<CSSStyleDeclaration>);
          el.innerHTML = SPARKLE(i % 3 === 0 ? "#C9A574" : "#FBEFD2", size);
          box.appendChild(el);
          gsap
            .timeline({ delay: i * 0.06, onComplete: () => el.remove() })
            .fromTo(
              el,
              { scale: 0, autoAlpha: 0, rotation: 0 },
              {
                scale: 1,
                autoAlpha: 1,
                rotation: 90,
                duration: 0.35,
                ease: "back.out(2)",
              }
            )
            .to(
              el,
              {
                y: gsap.utils.random(-90, -40),
                x: gsap.utils.random(-18, 18),
                autoAlpha: 0,
                rotation: 180,
                duration: gsap.utils.random(0.8, 1.2),
                ease: "power1.out",
              },
              ">-0.1"
            );
        }
      }

      // Vida própria dos ursinhos: flutuam, balões balançam presos à patinha,
      // perninhas balançam e os olhos piscam de vez em quando.
      function buildBearLoops() {
        const add = (t: gsap.core.Animation) => loopsRef.current.push(t);
        bears.forEach((b, i) => {
          const bob = b.querySelector(".bb-bob");
          const balloons = b.querySelector(".bb-balloons");
          const legs = b.querySelector(".bb-legs");
          add(
            gsap.to(bob, {
              y: -8,
              rotation: i === 0 ? 3 : -3,
              duration: 2.2 + i * 0.4,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            })
          );
          add(
            gsap.fromTo(
              balloons,
              { rotation: -5, svgOrigin: "73 125" },
              {
                rotation: 5,
                svgOrigin: "73 125",
                duration: 1.8 + i * 0.3,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
              }
            )
          );
          add(
            gsap.fromTo(
              legs,
              { rotation: -7, svgOrigin: "50 176" },
              {
                rotation: 7,
                svgOrigin: "50 176",
                duration: 0.9 + i * 0.15,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
              }
            )
          );
        });

        const peek = peekRef.current;
        if (peek) {
          add(
            gsap.fromTo(
              peek.querySelector(".pk-head"),
              { rotation: -6, svgOrigin: "60 100" },
              {
                rotation: 6,
                svgOrigin: "60 100",
                duration: 1.4,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
              }
            )
          );
        }

        // Piscadinha (ursinhos da cena, não o do selo).
        const eyes = [...bears, peek]
          .filter(Boolean)
          .flatMap((el) => Array.from(el!.querySelectorAll(".bh-eyes")));
        eyes.forEach((e, i) => {
          add(
            gsap.to(e, {
              scaleY: 0.1,
              transformOrigin: "50% 50%",
              duration: 0.08,
              ease: "power1.in",
              yoyo: true,
              repeat: -1,
              repeatDelay: 2.4 + i * 0.7,
              delay: 1 + i * 0.5,
            })
          );
        });
      }


      function startGlow() {
        const glow = glowRef.current;
        if (!glow) return;
        gsap.set(glow, { autoAlpha: 0.22, scale: 0.9 });
        const t = gsap.to(glow, {
          autoAlpha: 0.55,
          scale: 1.14,
          duration: 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        loopsRef.current.push(t);
      }

      // Corações rosa + estrelinhas azuis subindo devagar, bem sutis, + um bloom.
      function buildAmbient() {
        const box = ambientRef.current;
        if (!box) return;

        const bloom = document.createElement("div");
        const bd = env.width * 2.4;
        Object.assign(bloom.style, {
          position: "absolute",
          left: `${sealCX}px`,
          top: `${env.top + env.height * 0.5}px`,
          width: `${bd}px`,
          height: `${bd}px`,
          marginLeft: `${-bd / 2}px`,
          marginTop: `${-bd / 2}px`,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,244,224,0.5) 0%, rgba(240,214,160,0) 62%)",
          pointerEvents: "none",
        } as Partial<CSSStyleDeclaration>);
        box.appendChild(bloom);
        loopsRef.current.push(
          gsap.fromTo(
            bloom,
            { autoAlpha: 0.4, scale: 0.92 },
            {
              autoAlpha: 0.75,
              scale: 1.08,
              duration: 2.6,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            }
          )
        );

        for (let i = 0; i < ambientCount; i++) {
          const color = AMBIENT_COLORS[i % AMBIENT_COLORS.length];
          const size = gsap.utils.random(14, 24);
          const el = document.createElement("span");
          el.style.position = "absolute";
          el.style.pointerEvents = "none";
          el.innerHTML = AMBIENT_SHAPES[i % AMBIENT_SHAPES.length](color, size);
          box.appendChild(el);
          floatAmbient(el, i * 0.6);
        }
      }

      function floatAmbient(el: HTMLElement, delay: number) {
        if (doneRef.current) return;
        // Espalhados pela tela inteira e visíveis já no primeiro frame (a
        // abertura é curta): flutuam de leve no lugar em vez de subir do fundo.
        const startX = gsap.utils.random(vw * 0.04, vw * 0.96);
        const startY = gsap.utils.random(vh * 0.06, vh * 0.94);
        gsap.set(el, {
          left: startX,
          top: startY,
          x: 0,
          y: 0,
          rotation: gsap.utils.random(-18, 18),
          scale: gsap.utils.random(0.5, 0.7),
          transformOrigin: "center",
          autoAlpha: 0,
        });
        const t = gsap.timeline({ delay });
        // Entrada alegre: "pulinho" com back.out
        t.to(el, {
          autoAlpha: gsap.utils.random(0.42, 0.66),
          scale: gsap.utils.random(0.95, 1.15),
          duration: 0.7,
          ease: "back.out(1.7)",
        });
        // Depois flutua de leve no lugar, com balanço e "respiração" (loop)
        t.to(
          el,
          {
            y: `+=${gsap.utils.random(-40, 40)}`,
            x: `+=${gsap.utils.random(-30, 30)}`,
            rotation: `+=${gsap.utils.random(-25, 25)}`,
            scale: "+=0.1",
            duration: gsap.utils.random(2.6, 4),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          ">"
        );
        loopsRef.current.push(t);
      }

      function buildDust() {
        const box = dustRef.current;
        if (!box) return;
        for (let i = 0; i < dustCount; i++) {
          const dot = document.createElement("span");
          const size = gsap.utils.random(2, 3.5);
          Object.assign(dot.style, {
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(224,196,143,0.95) 0%, rgba(201,160,106,0) 70%)",
            pointerEvents: "none",
          } as Partial<CSSStyleDeclaration>);
          box.appendChild(dot);
          floatDust(dot, i * 0.5);
        }
      }

      function floatDust(dot: HTMLElement, delay: number) {
        if (doneRef.current) return;
        const startX = gsap.utils.random(env.left - 20, env.right + 20);
        const startY = gsap.utils.random(env.top + env.height * 0.3, env.bottom);
        gsap.set(dot, { left: startX, top: startY, x: 0, y: 0, autoAlpha: 0 });
        const t = gsap.timeline({ delay, onComplete: () => floatDust(dot, 0) });
        t.to(dot, { autoAlpha: gsap.utils.random(0.3, 0.7), duration: 1.0 });
        t.to(
          dot,
          {
            duration: gsap.utils.random(3.5, 5.5),
            physics2D: {
              velocity: gsap.utils.random(10, 26),
              angle: gsap.utils.random(250, 290),
              gravity: -5,
            },
            ease: "none",
          },
          0
        );
        t.to(dot, { autoAlpha: 0, duration: 1.4 }, "-=1.4");
        loopsRef.current.push(t);
      }

      // Faíscas suaves que piscam ao redor do selo durante a espera.
      function buildTwinkles() {
        const box = dustRef.current;
        if (!box) return;
        const n = small ? 3 : 5;
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n + gsap.utils.random(-0.3, 0.3);
          const r = SEAL_R * gsap.utils.random(1.1, 1.7);
          const size = gsap.utils.random(7, 12);
          const el = document.createElement("span");
          el.style.position = "absolute";
          el.style.left = `${sealCX + Math.cos(a) * r}px`;
          el.style.top = `${sealCY + Math.sin(a) * r}px`;
          el.style.marginLeft = `${-size / 2}px`;
          el.style.marginTop = `${-size / 2}px`;
          el.style.pointerEvents = "none";
          el.innerHTML = SPARKLE("#FBEFD2", size);
          box.appendChild(el);
          const t = gsap.fromTo(
            el,
            { scale: 0, autoAlpha: 0, rotation: 0 },
            {
              scale: 1,
              autoAlpha: gsap.utils.random(0.6, 0.95),
              rotation: 90,
              duration: gsap.utils.random(0.7, 1.1),
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              delay: i * 0.35,
            }
          );
          loopsRef.current.push(t);
        }
      }

      // Raios de luz suaves vindos do topo, com um leve "respirar".
      function buildRays() {
        const box = ambientRef.current;
        if (!box) return;
        const rays = document.createElement("div");
        // Feixes brancos suaves vindos do topo. Sem "screen" (some no fundo
        // claro): blend normal + bastante blur = luz macia e visível.
        Object.assign(rays.style, {
          position: "absolute",
          left: "0",
          top: "0",
          width: "100%",
          height: "78%",
          background:
            "conic-gradient(from 180deg at 50% -6%, rgba(255,255,255,0) 0deg, rgba(255,251,240,0.5) 9deg, rgba(255,255,255,0) 20deg, rgba(255,251,240,0.42) 34deg, rgba(255,255,255,0) 47deg, rgba(255,251,240,0.5) 62deg, rgba(255,255,255,0) 76deg)",
          filter: "blur(9px)",
          opacity: "0",
          pointerEvents: "none",
        } as Partial<CSSStyleDeclaration>);
        box.appendChild(rays);
        loopsRef.current.push(
          gsap.fromTo(
            rays,
            { opacity: 0.22 },
            {
              opacity: 0.5,
              duration: 3.2,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            }
          )
        );
      }

      // Orbes desfocados (bokeh) flutuando devagar: profundidade de "sonho".
      function buildBokeh() {
        const box = ambientRef.current;
        if (!box) return;
        const n = small ? 4 : 6;
        for (let i = 0; i < n; i++) {
          const orb = document.createElement("div");
          const d = gsap.utils.random(70, 160);
          const color =
            AMBIENT_COLORS[Math.floor(Math.random() * AMBIENT_COLORS.length)];
          Object.assign(orb.style, {
            position: "absolute",
            width: `${d}px`,
            height: `${d}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`,
            filter: "blur(6px)",
            opacity: "0",
            pointerEvents: "none",
          } as Partial<CSSStyleDeclaration>);
          box.appendChild(orb);
          floatBokeh(orb, i * 0.5);
        }
      }

      function floatBokeh(orb: HTMLElement, delay: number) {
        if (doneRef.current) return;
        gsap.set(orb, {
          left: gsap.utils.random(0, vw),
          top: gsap.utils.random(0, vh),
          x: 0,
          y: 0,
        });
        const t = gsap.timeline({ delay, onComplete: () => floatBokeh(orb, 0) });
        t.to(orb, { opacity: gsap.utils.random(0.22, 0.42), duration: 0.9 });
        t.to(
          orb,
          {
            x: gsap.utils.random(-60, 60),
            y: gsap.utils.random(-130, -40),
            duration: gsap.utils.random(7, 11),
            ease: "sine.inOut",
          },
          0
        );
        t.to(orb, { opacity: 0, duration: 1.6 }, "-=1.6");
        loopsRef.current.push(t);
      }

      // Céu estrelado: estrelinhas pequenas piscando em posições aleatórias.
      function buildStarfield() {
        const box = ambientRef.current;
        if (!box) return;
        const n = small ? 8 : 14;
        for (let i = 0; i < n; i++) {
          const size = gsap.utils.random(6, 11);
          const color =
            Math.random() < 0.5
              ? "#FBEFD2"
              : AMBIENT_COLORS[Math.floor(Math.random() * AMBIENT_COLORS.length)];
          const st = document.createElement("span");
          st.style.position = "absolute";
          st.style.left = `${gsap.utils.random(0, vw)}px`;
          st.style.top = `${gsap.utils.random(0, vh)}px`;
          st.style.pointerEvents = "none";
          st.innerHTML = STAR(color, size);
          box.appendChild(st);
          const t = gsap.fromTo(
            st,
            { scale: 0, autoAlpha: 0 },
            {
              scale: 1,
              autoAlpha: gsap.utils.random(0.55, 0.95),
              duration: gsap.utils.random(0.9, 1.6),
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              delay: gsap.utils.random(0, 1.2),
            }
          );
          loopsRef.current.push(t);
        }
      }

      function flashSeal() {
        const layer = fxLayerRef.current;
        if (!layer) return;
        const flash = document.createElement("div");
        const d = SEAL_R * 3.2;
        Object.assign(flash.style, {
          position: "absolute",
          left: `${sealCX}px`,
          top: `${sealCY}px`,
          width: `${d}px`,
          height: `${d}px`,
          marginLeft: `${-d / 2}px`,
          marginTop: `${-d / 2}px`,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #FFF4DC 0%, rgba(255,244,220,0) 65%)",
          pointerEvents: "none",
        } as Partial<CSSStyleDeclaration>);
        layer.appendChild(flash);
        gsap.fromTo(
          flash,
          { autoAlpha: 0, scale: 0.4 },
          {
            autoAlpha: 0.5,
            scale: 1.1,
            duration: 0.14,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            onComplete: () => flash.remove(),
          }
        );
      }

      function spawnShards() {
        const layer = fxLayerRef.current;
        if (!layer) return;
        for (let i = 0; i < 6; i++) {
          const shard = document.createElement("div");
          const size = gsap.utils.random(6, 11);
          Object.assign(shard.style, {
            position: "absolute",
            left: `${sealCX}px`,
            top: `${sealCY}px`,
            width: `${size}px`,
            height: `${size}px`,
            marginLeft: `${-size / 2}px`,
            marginTop: `${-size / 2}px`,
            borderRadius: "40% 55% 45% 60%",
            background:
              "radial-gradient(circle at 35% 30%, #E2C48F 0%, #C9A06A 55%, #8A6440 100%)",
            pointerEvents: "none",
          } as Partial<CSSStyleDeclaration>);
          layer.appendChild(shard);
          gsap.to(shard, {
            duration: gsap.utils.random(0.55, 0.8),
            physics2D: {
              velocity: gsap.utils.random(110, 240),
              angle: gsap.utils.random(0, 360),
              gravity: 420,
            },
            rotation: gsap.utils.random(-200, 200),
            autoAlpha: 0,
            ease: "softDrop",
            onComplete: () => shard.remove(),
          });
        }
      }

      // Idle dos balões: y/rotação mínimos, sine.inOut, cada um diferente.
      function buildBalloons() {
        const configs = [
          { el: pinkRef.current, dur: 3.2, rot: 2, amp: 6, delay: 0 },
          { el: blueRef.current, dur: 3.8, rot: -2.2, amp: 5, delay: 0.4 },
        ];
        for (const { el, dur, rot, amp, delay } of configs) {
          if (!el) continue;
          gsap.set(el, { transformOrigin: "center" });
          const t = gsap.to(el, {
            y: -amp,
            rotation: rot,
            duration: dur,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay,
          });
          loopsRef.current.push(t);
        }
      }

      // POP: squash (antecipação) → estica e some; libera elementos + micro-linhas.
      function popBalloon(el: HTMLDivElement | null, palette: readonly string[]) {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.4; // corpo do balão
        gsap.killTweensOf(el); // encerra o idle deste balão
        gsap
          .timeline()
          .to(el, {
            scaleX: 0.86,
            scaleY: 1.14,
            duration: 0.09,
            ease: "power1.out",
          })
          .to(el, {
            scaleX: 1.12,
            scaleY: 1.12,
            autoAlpha: 0,
            duration: 0.2,
            ease: "power2.out",
            onStart: () => {
              spawnPopPieces(cx, cy, palette);
              spawnImpactLines(cx, cy);
              if ("vibrate" in navigator) navigator.vibrate?.(12);
            },
          });
      }

      function spawnPopPieces(
        cx: number,
        cy: number,
        palette: readonly string[]
      ) {
        const layer = fxLayerRef.current;
        if (!layer || doneRef.current) return; // não solta nada após finalizar/pular
        const n = small ? 5 : 7;
        for (let i = 0; i < n; i++) {
          const color = palette[Math.floor(Math.random() * palette.length)];
          const piece = makePopPiece(color);
          Object.assign(piece.style, {
            position: "absolute",
            left: `${cx}px`,
            top: `${cy}px`,
            pointerEvents: "none",
          } as Partial<CSSStyleDeclaration>);
          layer.appendChild(piece);
          gsap.set(piece, { xPercent: -50, yPercent: -50, scale: 0.2, autoAlpha: 0 });
          // Leque radial orgânico (predominante para cima), com leve gravidade.
          const angle = (-90 + gsap.utils.random(-95, 95)) * (Math.PI / 180);
          const dist = gsap.utils.random(small ? 26 : 40, small ? 58 : 92);
          gsap
            .timeline({ onComplete: () => piece.remove() })
            .to(piece, {
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist + gsap.utils.random(6, 18),
              rotation: gsap.utils.random(-140, 140),
              scale: gsap.utils.random(0.85, 1.1),
              autoAlpha: 1,
              duration: gsap.utils.random(0.5, 0.75),
              ease: "power2.out",
              delay: gsap.utils.random(0, 0.06),
            })
            .to(
              piece,
              { scale: 0.7, autoAlpha: 0, duration: 0.35, ease: "power1.in" },
              ">-0.1"
            );
        }
      }

      // 2–3 micro-linhas radiais que comunicam o "estouro" (sem flash de tela).
      function spawnImpactLines(cx: number, cy: number) {
        const layer = fxLayerRef.current;
        if (!layer || doneRef.current) return;
        for (let i = 0; i < 3; i++) {
          const line = document.createElement("div");
          const ang = -60 + i * 60 + gsap.utils.random(-12, 12);
          Object.assign(line.style, {
            position: "absolute",
            left: `${cx}px`,
            top: `${cy}px`,
            width: "2px",
            height: `${gsap.utils.random(7, 11)}px`,
            borderRadius: "2px",
            background: "rgba(180,150,120,0.55)",
            transformOrigin: "50% 100%",
            pointerEvents: "none",
          } as Partial<CSSStyleDeclaration>);
          layer.appendChild(line);
          gsap.set(line, { rotation: ang, scaleY: 0.3, autoAlpha: 0 });
          gsap
            .timeline({ onComplete: () => line.remove() })
            .to(line, {
              scaleY: 1,
              autoAlpha: 0.7,
              y: -6,
              duration: 0.14,
              ease: "power2.out",
            })
            .to(line, { autoAlpha: 0, y: -12, duration: 0.2, ease: "power1.in" });
        }
      }

      function makePopPiece(color: string): HTMLElement {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        const kind = Math.floor(Math.random() * 4);
        const size = gsap.utils.random(7, 11);
        span.innerHTML =
          kind === 0
            ? HEART(color, size)
            : kind === 1
            ? STAR(color, size)
            : kind === 2
            ? DOT(color, size * 0.7)
            : CONFETTI_CURVE(color, size);
        return span;
      }

      function fireConfetti(count: number) {
        const layer = confettiLayerRef.current;
        if (!layer) return;
        const originX = env.left + env.width * 0.5;
        const originY = env.top - env.height * 0.05;
        for (let i = 0; i < count; i++) {
          const el = makeConfetti();
          Object.assign(el.style, {
            position: "absolute",
            left: `${originX}px`,
            top: `${originY}px`,
            pointerEvents: "none",
          } as Partial<CSSStyleDeclaration>);
          layer.appendChild(el);
          gsap.set(el, { xPercent: -50, yPercent: -50 });
          gsap.to(el, {
            duration: gsap.utils.random(1.2, 1.9),
            physics2D: {
              velocity: gsap.utils.random(160, 360),
              angle: gsap.utils.random(-110, -70),
              gravity: 480,
            },
            rotation: gsap.utils.random(-300, 300),
            ease: "none",
            onComplete: () => el.remove(),
          });
          gsap.to(el, {
            autoAlpha: 0,
            duration: gsap.utils.random(0.6, 0.9),
            delay: gsap.utils.random(0.5, 0.8),
            ease: "power1.in",
          });
        }
      }

      function makeConfetti(): HTMLElement {
        const color =
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const kind = Math.floor(Math.random() * 3);
        if (kind === 0) {
          const sq = document.createElement("div");
          const w = gsap.utils.random(6, 10);
          Object.assign(sq.style, {
            width: `${w}px`,
            height: `${w * gsap.utils.random(0.6, 1)}px`,
            background: color,
            borderRadius: "1px",
          } as Partial<CSSStyleDeclaration>);
          return sq;
        }
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.innerHTML =
          kind === 1
            ? HEART(color, 12)
            : `<svg width="13" height="13" viewBox="0 0 64 64" fill="${color}"><circle cx="20" cy="22" r="6"/><circle cx="44" cy="22" r="6"/><circle cx="12" cy="39" r="6"/><circle cx="52" cy="39" r="6"/><ellipse cx="32" cy="45" rx="14" ry="11"/></svg>`;
        return span;
      }
    },
    { scope: rootRef }
  );

  useEffect(() => {
    function onResize() {
      if (!doneRef.current) tlRef.current?.progress(1);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Toque durante a apresentação → acelera até a chacoalhada e abre (sem
  // "teletransportar" os ursinhos). Toque depois que abriu → pula tudo.
  function handleSkip() {
    const tl = tlRef.current;
    if (doneRef.current || !tl) return;
    const wiggle = tl.labels.wiggle;
    if (wiggle !== undefined && tl.time() < wiggle) {
      if (!acceleratedRef.current) {
        acceleratedRef.current = true;
        gsap.to(tl, { timeScale: 4, duration: 0.25, ease: "power1.in" });
      }
      return;
    }
    tl.progress(1);
  }

  return (
    <div
      ref={rootRef}
      onClick={handleSkip}
      className="fixed inset-0 z-30 cursor-pointer overflow-hidden"
    >
      {/* Cena (recebe o zoom de câmera; limpo por completo no finalize).
          Sem will-change inline: evita criar bloco de contenção permanente que
          quebraria o position:fixed da página final e a moldura decorativa. */}
      <div
        ref={sceneRef}
        className="absolute inset-0"
        style={{ visibility: "hidden" }}
      >
        {/* Fundo ao redor do envelope (mesmo da página) */}
        <BackgroundPattern />

        {/* 0 · Ambiente: corações/estrelinhas flutuando + bloom (atrás de tudo) */}
        <div
          ref={ambientRef}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />

        {/* 0b · Balões (rosa/azul bebê) flanqueando o envelope; farão "POP".
            Presos à geometria do envelope (responsivo) e env-part (entram com
            o envelope e somem no fim). Ficam atrás do bolso/aba (zIndex 1). */}
        <div
          className="env-part pointer-events-none absolute inset-0 m-auto w-[min(86vw,340px)] h-[calc(min(86vw,340px)*0.656)]"
          style={{ zIndex: 1 }}
          aria-hidden="true"
        >
          <div ref={pinkRef} className="absolute left-[-7%] top-[-46%] w-10 sm:w-12">
            <BalloonSvg palette={BALLOON_PINK} />
          </div>
          <div ref={blueRef} className="absolute right-[-5%] top-[-58%] w-9 sm:w-11">
            <BalloonSvg palette={BALLOON_BLUE} />
          </div>
        </div>

        {/* 0b' · Varal de bandeirinhas no topo (desce no início, sobe no fim) */}
        <div
          ref={buntingRef}
          className="intro-part pointer-events-none absolute inset-x-0 top-3 flex justify-center px-4"
          style={{ zIndex: 1 }}
          aria-hidden="true"
        >
          <Bunting className="w-full max-w-[460px]" />
        </div>

        {/* 0c · Rodapé de nuvens com um ursinho espiando (sobe no início,
            afunda quando o papel sai). */}
        <div
          ref={groundRef}
          className="intro-part pointer-events-none absolute inset-x-0 bottom-0 h-[min(20vh,150px)]"
          style={{ zIndex: 1 }}
          aria-hidden="true"
        >
          <CloudBank
            fill="#F4E8D6"
            d="M0 100 V52 C20 28 55 28 70 46 C82 20 125 16 140 42 C155 24 190 26 200 44 C215 18 260 18 272 42 C285 26 320 28 330 46 C345 24 385 28 400 48 V100 Z"
          />
          <div
            ref={peekRef}
            className="absolute bottom-[34%] left-1/2 w-[min(18vw,74px)] -ml-[min(9vw,37px)]"
          >
            <PeekBearSvg />
          </div>
          <CloudBank
            fill="#FBF5EC"
            d="M0 100 V68 C25 48 60 50 75 64 C92 44 130 44 145 62 C165 48 190 50 200 60 C212 46 245 44 262 62 C280 48 315 48 328 64 C345 50 380 50 400 66 V100 Z"
          />
        </div>

        {/* 0d · Ursinhos segurando balões, flanqueando o envelope (atrás dele).
            Posição relativa ao centro: colados ao envelope em qualquer largura. */}
        {[
          { side: "left", palettes: [BALLOON_PINK, BALLOON_PINK_SOFT] },
          { side: "right", palettes: [BALLOON_BLUE, BALLOON_BLUE_SOFT] },
        ].map(({ side, palettes }) => (
          <div
            key={side}
            className="bb intro-part pointer-events-none absolute bottom-[calc(min(20vh,150px)*0.32)] w-[min(21vw,92px)]"
            style={{
              [side]: "calc(50% - min(49vw, 250px))",
              zIndex: 1,
            }}
            aria-hidden="true"
          >
            <div className="bb-bob">
              <BalloonBearSvg
                palettes={palettes as [typeof BALLOON_PINK, typeof BALLOON_PINK]}
                mirrored={side === "right"}
              />
            </div>
          </div>
        ))}

        {/* 1 · Fundo/interior do envelope */}
        <div
          ref={envRef}
          className={ENV_BOX + " rounded-[10px]"}
          style={{
            zIndex: 1,
            ...LINER,
            // Sombra dupla: contato próximo + difusa, dá "peso" ao envelope.
            boxShadow:
              "0 22px 38px -18px rgba(92,68,51,0.55), 0 6px 12px -6px rgba(92,68,51,0.35), inset 0 0 0 1px rgba(168,139,102,0.35)",
          }}
        />

        {/* 2 · Máscara presa ao envelope, com o papel (página) dentro. */}
        <div ref={maskRef} className="absolute overflow-hidden">
          <div
            ref={letterRef}
            className="absolute w-screen min-h-[100dvh]"
            style={{ visibility: "hidden" }}
          >
            <BackgroundPattern interactive />
            <MainPage ref={heroRef} autoPlay={false} />
          </div>
        </div>

        {/* 3 · Bolso frontal (abas laterais + inferior) */}
        <div
          className={ENV_BOX}
          style={{
            zIndex: 3,
            clipPath: "polygon(0% 0%, 50% 55%, 100% 0%, 100% 100%, 0% 100%)",
            background: "#D3BA96",
          }}
        >
          <svg
            viewBox="0 0 320 210"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="env-side-l" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#CBAF88" />
                <stop offset="1" stopColor="#D7BF9B" />
              </linearGradient>
              <linearGradient id="env-side-r" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0" stopColor="#CBAF88" />
                <stop offset="1" stopColor="#D7BF9B" />
              </linearGradient>
              <linearGradient id="env-bottom" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#D2B892" />
                <stop offset="1" stopColor="#E2CDAC" />
              </linearGradient>
              <filter id="env-fold-shadow" x="-10%" y="-20%" width="120%" height="140%">
                <feDropShadow dx="0" dy="-2.5" stdDeviation="2.4" floodColor="#5C4433" floodOpacity="0.28" />
              </filter>
            </defs>
            {/* Abas laterais (um tom mais escuro nas bordas externas) */}
            <polygon points={`0,0 ${TIP_X},${TIP_Y} 0,210`} fill="url(#env-side-l)" />
            <polygon points={`320,0 ${TIP_X},${TIP_Y} 320,210`} fill="url(#env-side-r)" />
            {/* Aba inferior por cima das laterais, projetando sombra */}
            <polygon
              points={`0,210 ${TIP_X},${TIP_Y + 4} 320,210`}
              fill="url(#env-bottom)"
              filter="url(#env-fold-shadow)"
            />
            {/* Filete de luz na dobra da aba inferior */}
            <path
              d={`M2 208 L${TIP_X} ${TIP_Y + 5} L318 208`}
              fill="none"
              stroke="#FFF7EA"
              strokeOpacity="0.55"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            {/* Vincos das abas laterais */}
            <path
              d={`M0 0 L${TIP_X} ${TIP_Y} L320 0`}
              fill="none"
              stroke="#A88B66"
              strokeOpacity="0.4"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* Textura de papel */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: PAPER_TEXTURE,
              mixBlendMode: "multiply",
              opacity: 0.35,
            }}
          />
        </div>

        {/* 3b · Sombra que a aba fechada projeta no bolso (some ao abrir) */}
        <div
          ref={flapShadowRef}
          className={ENV_BOX}
          style={{ zIndex: 3, filter: "blur(3px)" }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0% 0%, 100% 0%, 50% 58%)",
              background: "rgba(92,68,51,0.3)",
              transform: "translateY(3px)",
            }}
          />
        </div>

        {/* 4 · Aba superior (gira para cima; duas faces). */}
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
          <div
            ref={flapBackRef}
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0% 0%, 100% 0%, 50% 55%)",
              ...LINER,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              visibility: "hidden",
            }}
          />
          <div
            ref={flapFrontRef}
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0% 0%, 100% 0%, 50% 55%)",
              background:
                "linear-gradient(180deg, #E6D3B4 0%, #D9BF99 60%, #CFB28A 100%)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(0.1px)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: PAPER_TEXTURE,
                mixBlendMode: "multiply",
                opacity: 0.35,
              }}
            />
            <svg
              viewBox="0 0 320 210"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {/* Filete de luz na borda superior */}
              <path
                d="M0 1 H320"
                stroke="#FFF7EA"
                strokeOpacity="0.7"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* Costura pontilhada acompanhando a borda da aba */}
              <path
                d={`M14 7 L${TIP_X} ${TIP_Y - 13} L306 7`}
                fill="none"
                stroke="#A88B66"
                strokeOpacity="0.55"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Marca da dobra (borda inferior da aba) */}
              <path
                d={`M0 0 L${TIP_X} ${TIP_Y} L320 0`}
                fill="none"
                stroke="#8A6A4F"
                strokeOpacity="0.35"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>

        {/* 4b · Brilho pulsante atrás do selo (fase de espera) */}
        <div
          ref={glowRef}
          className={ENV_BOX}
          aria-hidden="true"
          style={{ zIndex: 4 }}
        >
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "55%",
              width: `${SEAL_R * 3.4}px`,
              height: `${SEAL_R * 3.4}px`,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(240,214,160,0.85) 0%, rgba(201,160,106,0) 70%)",
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
          <path
            ref={crackRef}
            d={CRACK_CLOSED}
            fill="none"
            stroke="#4A3421"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0"
          />
        </svg>

        {/* 6 · Poeira de luz + faíscas do selo */}
        <div
          ref={dustRef}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 6 }}
          aria-hidden="true"
        />

        {/* 7 · Título acima do envelope (some na chacoalhada) */}
        <div
          ref={introTextRef}
          className={"intro-part pointer-events-none " + ENV_SIZE}
          style={{ zIndex: 6 }}
        >
          <div className="absolute bottom-full left-1/2 mb-[21%] w-[118%] -translate-x-1/2 text-center">
            <Sparkle className="left-[4%] top-[38%] h-4 w-4" delay={0} />
            <Sparkle className="right-[3%] top-[20%] h-3 w-3" delay={0.8} />
            <Sparkle className="right-[9%] top-[70%] h-2.5 w-2.5" delay={1.5} />
            <p
              ref={kickerRef}
              className="font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-brownlabel"
            >
              ✦ chegou pra você ✦
            </p>
            <h2
              ref={titleRef}
              className="mt-1 font-display text-[26px] leading-tight text-browndark sm:text-3xl"
            >
              Um convite especial
            </h2>
            <svg
              viewBox="0 0 200 14"
              className="mx-auto mt-1 w-[58%]"
              aria-hidden="true"
            >
              <path
                ref={underlineRef}
                d="M4 9 C30 3 50 12 76 7 S122 3 146 8 S182 11 196 5"
                fill="none"
                stroke="#C9A574"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Camadas de efeito em espaço de tela (fora do zoom) */}
      <div
        ref={fxLayerRef}
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 40 }}
        aria-hidden="true"
      />
      <div
        ref={confettiLayerRef}
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 41 }}
        aria-hidden="true"
      />
    </div>
  );
}

/** Balão decorativo delicado (corpo, nó, cordão orgânico e brilho sutil). */
function BalloonSvg({ palette }: { palette: { body: string; edge: string } }) {
  return (
    <svg viewBox="0 0 44 74" className="w-full" aria-hidden="true">
      {/* Corpo */}
      <path
        d="M22 3 C33 3 40 12 40 25 C40 39 30 49 22 51 C14 49 4 39 4 25 C4 12 11 3 22 3 Z"
        fill={palette.body}
      />
      {/* Nó */}
      <path d="M22 51 L18 57 L26 57 Z" fill={palette.edge} />
      {/* Cordão orgânico */}
      <path
        d="M22 57 q7 7 0 13 q-7 7 0 13"
        fill="none"
        stroke={palette.edge}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Brilho sutil */}
      <ellipse cx="15" cy="17" rx="4" ry="7" fill="#FFFFFF" opacity="0.3" />
    </svg>
  );
}

type BalloonPalette = { body: string; edge: string };

/** Corpo de balão sem cordão (o cordão é desenhado até a patinha do urso). */
function BalloonBody({ palette }: { palette: BalloonPalette }) {
  return (
    <>
      <path
        d="M22 3 C33 3 40 12 40 25 C40 39 30 49 22 51 C14 49 4 39 4 25 C4 12 11 3 22 3 Z"
        fill={palette.body}
      />
      <path d="M22 51 L18 57 L26 57 Z" fill={palette.edge} />
      <ellipse cx="15" cy="17" rx="4" ry="7" fill="#FFFFFF" opacity="0.35" />
    </>
  );
}

/**
 * Ursinho de corpo inteiro sendo levado por dois balões, segurando os cordões
 * com a patinha erguida (pivô do balanço em 73,125; quadril em 50,176).
 */
function BalloonBearSvg({
  palettes,
  mirrored,
}: {
  palettes: [BalloonPalette, BalloonPalette];
  mirrored?: boolean;
}) {
  const [a, b] = palettes;
  const fur = "#C9A574";
  return (
    <svg
      viewBox="0 0 100 200"
      className="w-full overflow-visible"
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
    >
      <g className="bb-balloons">
        <path
          d="M28 57 Q46 96 73 125"
          fill="none"
          stroke={a.edge}
          strokeWidth="1.2"
          opacity="0.7"
        />
        <path
          d="M67 54 Q62 94 73 125"
          fill="none"
          stroke={b.edge}
          strokeWidth="1.2"
          opacity="0.7"
        />
        <g transform="translate(8 6) scale(0.9)">
          <BalloonBody palette={a} />
        </g>
        <g transform="translate(46 0) scale(0.95)">
          <BalloonBody palette={b} />
        </g>
      </g>
      <g className="bb-legs">
        <ellipse cx="42" cy="184" rx="7" ry="9" fill="#BD9764" />
        <ellipse cx="58" cy="184" rx="7" ry="9" fill="#BD9764" />
        <ellipse cx="42" cy="189" rx="4" ry="3" fill="#8B6F52" opacity="0.45" />
        <ellipse cx="58" cy="189" rx="4" ry="3" fill="#8B6F52" opacity="0.45" />
      </g>
      <ellipse cx="50" cy="163" rx="18" ry="19" fill={fur} />
      <ellipse cx="50" cy="168" rx="11" ry="12" fill="#FAF6F0" opacity="0.85" />
      <path
        d="M36 155 Q26 163 31 173"
        fill="none"
        stroke={fur}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M63 153 Q72 143 73 129"
        fill="none"
        stroke={fur}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="73" cy="126" r="5.5" fill={fur} />
      <g transform="translate(20 95) scale(0.5)">
        <BearHeadInline blush />
      </g>
    </svg>
  );
}

/** Ursinho espiando por cima das nuvens (cabeça + patinhas na borda). */
function PeekBearSvg() {
  return (
    <svg viewBox="0 0 120 112" className="w-full overflow-visible" aria-hidden="true">
      <g className="pk-head">
        <BearHeadInline blush />
      </g>
      <ellipse cx="24" cy="102" rx="12" ry="9" fill="#C9A574" />
      <ellipse cx="96" cy="102" rx="12" ry="9" fill="#C9A574" />
      <ellipse cx="24" cy="104" rx="6" ry="4" fill="#8B6F52" opacity="0.4" />
      <ellipse cx="96" cy="104" rx="6" ry="4" fill="#8B6F52" opacity="0.4" />
    </svg>
  );
}

/** Faixa de nuvens do rodapé (esticada na largura da tela). */
function CloudBank({ d, fill }: { d: string; fill: string }) {
  return (
    <svg
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      style={{ filter: "drop-shadow(0 -4px 10px rgba(176,137,104,0.12))" }}
      aria-hidden="true"
    >
      <path d={d} fill={fill} />
    </svg>
  );
}

/** Cabeça de urso desenhada em SVG (mesmas cores do BearHead). */
function BearHeadInline({ blush = false }: { blush?: boolean }) {
  return (
    <g>
      <circle cx="30" cy="34" r="18" fill="#C9A574" />
      <circle cx="90" cy="34" r="18" fill="#C9A574" />
      <circle cx="30" cy="34" r="9" fill="#8B6F52" />
      <circle cx="90" cy="34" r="9" fill="#8B6F52" />
      <circle cx="60" cy="66" r="40" fill="#C9A574" />
      <ellipse cx="60" cy="78" rx="24" ry="19" fill="#FAF6F0" />
      {blush && (
        <>
          <circle cx="33" cy="74" r="7" fill="#E8B9A0" opacity="0.75" />
          <circle cx="87" cy="74" r="7" fill="#E8B9A0" opacity="0.75" />
        </>
      )}
      <g className="bh-eyes">
        <circle cx="47" cy="60" r="5" fill="#5C4433" />
        <circle cx="73" cy="60" r="5" fill="#5C4433" />
        <circle cx="48.6" cy="58.4" r="1.6" fill="#FFFFFF" />
        <circle cx="74.6" cy="58.4" r="1.6" fill="#FFFFFF" />
      </g>
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
