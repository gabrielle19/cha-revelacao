"use client";

/**
 * Registro central dos plugins do GSAP (todos gratuitos desde a mudança de
 * licença do Webflow). Importado só por componentes de cliente; o registro
 * acontece dentro de `ensureGsap()`, chamado no navegador (nunca no SSR).
 */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/** Registra plugins e cria os eases personalizados uma única vez. */
export function ensureGsap(): void {
  if (registered || typeof window === "undefined") return;
  registered = true;

  gsap.registerPlugin(
    useGSAP,
    Physics2DPlugin,
    MorphSVGPlugin,
    SplitText,
    CustomEase
  );

  // "Respiro" orgânico para a subida do papel: acelera e assenta com um leve
  // freio, mais vivo que power3.out.
  CustomEase.create("paperRise", "M0,0 C0.14,0.86 0.28,1.02 0.5,1.01 0.72,1 0.86,1 1,1");
  // Queda macia com leve chicote no fim (poeira/estilhaços que assentam).
  CustomEase.create("softDrop", "M0,0 C0.3,0 0.5,0.2 0.62,0.55 0.74,0.9 0.86,1 1,1");
}

export { gsap, useGSAP, Physics2DPlugin, MorphSVGPlugin, SplitText, CustomEase };
