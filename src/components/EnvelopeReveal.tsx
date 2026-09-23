"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP, ensureGsap } from "@/lib/gsap-plugins";
import BackgroundPattern from "@/components/BackgroundPattern";
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

const ENV_BOX =
  "env-part absolute inset-0 m-auto w-[min(86vw,340px)] h-[calc(min(86vw,340px)*0.656)]";

const TIP_X = 160;
const TIP_Y = 210 * 0.55; // 115.5
const SEAL_R = (320 * 0.24) / 2; // ~38.4

// Rachadura do selo (MorphSVG): costura reta fechada → fenda em ziguezague.
const CRACK_CLOSED = "M160 96 L160 100 L160 116 L160 132 L160 136";
const CRACK_OPEN = "M160 80 L150 100 L168 116 L150 132 L162 150";

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
  const glowRef = useRef<HTMLDivElement>(null); // brilho pulsante do selo
  const sealRef = useRef<SVGSVGElement>(null);
  const crackRef = useRef<SVGPathElement>(null);
  const dustRef = useRef<HTMLDivElement>(null); // poeira de luz + faíscas do selo
  const fxLayerRef = useRef<HTMLDivElement>(null); // flash + estilhaços (tela)
  const confettiLayerRef = useRef<HTMLDivElement>(null); // confete (tela)
  const heroRef = useRef<MainPageHandle>(null); // dispara a revelação do hero

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const loopsRef = useRef<gsap.core.Animation[]>([]);
  const doneRef = useRef(false);
  const reducedRef = useRef(false);

  useGSAP(
    () => {
      ensureGsap();

      const mask = maskRef.current!;
      const letter = letterRef.current!;
      const envParts = gsap.utils.toArray<HTMLElement>(
        rootRef.current!.querySelectorAll(".env-part")
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
        gsap.set(envParts, { display: "none" });
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
        gsap.set(envParts, { display: "none" });
        finalize();
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

      gsap.set(flapRef.current, {
        transformOrigin: "top center",
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

      const tl = gsap.timeline({ delay: 0.15, onComplete: finalize });
      tlRef.current = tl;

      // 1. Envelope + selo entram juntos (rápido e suave)
      tl.from(envParts, {
        y: 24,
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
      });

      // Site abriu → o envelope já abre. Só um respiro curtíssimo.
      tl.addLabel("crack", "+=0.25");

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
      tl.set(flapBackRef.current, { visibility: "visible" }, "flap+=0.4");
      tl.set(flapFrontRef.current, { visibility: "hidden" }, "flap+=0.4");
      tl.set(flapRef.current, { zIndex: 0 }, "flap+=0.4");

      // 4. Papel sobe "desenrolando" (rotateX → 0), sem tingir a cor
      tl.addLabel("rise", "flap+=0.5");
      tl.set(letter, { autoAlpha: 1 }, "rise");
      tl.to(
        letter,
        { y: yRise, rotateX: 0, duration: 0.8, ease: "paperRise" },
        "rise"
      );
      tl.add(() => fireConfetti(confettiBase), "rise+=0.45");

      // 5. Expansão: o papel "infla" suavemente até a tela cheia enquanto o
      //    envelope recua e some com delicadeza. Câmera volta ao normal em
      //    sincronia, para uma renderização macia (sem "pulo" nem pressa).
      tl.addLabel("expand", "rise+=0.72");
      tl.set(mask, { overflow: "visible", zIndex: 10 }, "expand");
      tl.to(
        sceneRef.current,
        { scale: 1, duration: 0.95, ease: "sine.inOut" },
        "expand"
      );
      // Envelope recua atrás do papel (some no lugar, sem voar).
      tl.to(
        envParts,
        { y: 46, autoAlpha: 0, duration: 0.5, ease: "power2.in" },
        "expand"
      );
      // Papel cresce com uma curva macia (power3.inOut assenta suave no fim).
      tl.to(
        letter,
        {
          scale: 1,
          y: yFinal,
          rotateX: 0,
          borderRadius: 0,
          duration: 0.95,
          ease: "power3.inOut",
        },
        "expand"
      );
      // 6. Segunda rajada de confete (leve) quando a expansão termina
      tl.add(() => fireConfetti(Math.round(confettiBase / 2)), "expand+=0.55");

      // ────────────────────────── helpers ──────────────────────────

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
      {/* Cena (recebe o zoom de câmera; limpo por completo no finalize).
          Sem will-change inline: evita criar bloco de contenção permanente que
          quebraria o position:fixed da página final e a moldura decorativa. */}
      <div ref={sceneRef} className="absolute inset-0">
        {/* Fundo ao redor do envelope (mesmo da página) */}
        <BackgroundPattern />

        {/* 0 · Ambiente: corações/estrelinhas flutuando + bloom (atrás de tudo) */}
        <div
          ref={ambientRef}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />

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
              background: "#E6D6BF",
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
              background: "linear-gradient(180deg, #E0CBAB 0%, #D3B78F 100%)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(0.1px)",
            }}
          />
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
