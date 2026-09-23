"use client";

import { MotionConfig, motion } from "framer-motion";
import {
  MapPin,
  Shirt,
  Gift,
  HeartHandshake,
  Mail,
  ChevronRight,
} from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import BearHead from "@/components/BearHead";
import Countdown from "@/components/Countdown";
import DecorativeFrame from "@/components/DecorativeFrame";
import LocalModal from "@/components/modals/LocalModal";
import TrajeModal from "@/components/modals/TrajeModal";
import PresenteModal from "@/components/modals/PresenteModal";
import ConfirmarModal from "@/components/modals/ConfirmarModal";
import RecadoModal from "@/components/modals/RecadoModal";
import { EVENT, VERSE } from "@/lib/event";

type ModalKey =
  | "local"
  | "traje"
  | "presente"
  | "confirmar"
  | "recado"
  | null;

/** Permite à abertura do envelope disparar a revelação do hero. */
export type MainPageHandle = { play: () => void };

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// Composição do título: "Bernardo" entra da esquerda, "ou" com um pequeno
// scale, "Maria Júlia" da direita — em sequência.
const titleGroup = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.02 } },
};
const fromLeft = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};
const ouPop = {
  hidden: { opacity: 0, scale: 0.6 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
  },
};
const fromRight = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const MainPage = forwardRef<MainPageHandle, { autoPlay?: boolean }>(
  function MainPage({ autoPlay = true }, ref) {
    const [modal, setModal] = useState<ModalKey>(null);
    // O hero começa escondido quando a abertura controla o momento da revelação
    // (autoPlay=false). Ela chama `play()` quando o papel assenta na tela.
    const [playing, setPlaying] = useState(autoPlay);
    useImperativeHandle(ref, () => ({ play: () => setPlaying(true) }), []);

    return (
      <MotionConfig reducedMotion="user">
        <DecorativeFrame />
        <motion.main
          variants={container}
          initial="hidden"
          animate={playing ? "show" : "hidden"}
          className="mx-auto flex min-h-[100dvh] w-full max-w-content flex-col items-center gap-6 px-5 py-10 text-center"
        >
          {/* Selo */}
          <motion.div variants={item}>
            <motion.span
              className="chip text-xs uppercase tracking-[0.25em]"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              {EVENT.title}
            </motion.span>
          </motion.div>

          {/* Ursinho flutuante — entrada (item) separada da flutuação contínua.
              Segura um balão rosa e um azul: a dúvida do chá, de um jeito fofo. */}
          <motion.div variants={item}>
            <motion.div
              className="relative"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            >
              <HeroBalloon
                color={BALLOON_PINK}
                className="-left-9 -top-7"
                tilt={-14}
                delay={0}
              />
              <HeroBalloon
                color={BALLOON_BLUE}
                className="-right-9 -top-10"
                tilt={14}
                delay={0.6}
              />
              <BearHead size={120} blush className="relative" />
            </motion.div>
          </motion.div>

          {/* Título — composição: Bernardo (esq) · ou (scale) · Maria Júlia (dir) */}
          <motion.h1
            variants={titleGroup}
            className="font-display text-4xl leading-tight text-browndark sm:text-5xl"
          >
            <motion.span variants={fromLeft} className="inline-block">
              {EVENT.babyOptions.a}
            </motion.span>
            <br />
            <motion.span
              variants={ouPop}
              className="inline-block font-body text-2xl italic text-brownlabel"
            >
              ou
            </motion.span>{" "}
            <motion.span variants={fromRight} className="inline-block">
              {EVENT.babyOptions.b}?
            </motion.span>
          </motion.h1>

          {/* Data e horário */}
          <motion.div variants={item} className="flex flex-wrap justify-center gap-3">
            <motion.span
              className="chip"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
            >
              {EVENT.dateLong}
            </motion.span>
            <motion.span
              className="chip"
              animate={{ y: [0, -4, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3.2,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              {EVENT.time}
            </motion.span>
          </motion.div>

          {/* Contagem regressiva */}
          <motion.div variants={item}>
            <Countdown />
          </motion.div>

          {/* Versículo */}
          <motion.div variants={item} className="w-full">
            <motion.div
              className="card w-full px-6 py-5"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <p className="font-body italic text-brownlabel-deep">
                &ldquo;{VERSE.text}&rdquo;
              </p>
              <p className="mt-2 font-body text-sm font-semibold text-caramel">
                {VERSE.ref}
              </p>
            </motion.div>
          </motion.div>

          {/* Cartinha na voz do bebê, com um ursinho espiando por cima */}
          <motion.div variants={item} className="relative w-full pt-9">
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <PeekBearHeart />
              </motion.div>
            </div>
            <div className="relative w-full rounded-card border-2 border-beige bg-cream-soft px-6 pb-5 pt-10 shadow-card">
              {/* Borda pontilhada interna: papel de carta */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-2 rounded-[16px] border border-dashed border-beige"
              />
              <p className="relative font-body text-[17px] italic leading-relaxed text-browndark">
                Antes mesmo de chegar, já existe muito amor esperando por mim.
                Ter você pertinho vai deixar esse momento ainda mais especial 🤎
              </p>
              
            </div>
          </motion.div>

          {/* Chamada para os detalhes */}
          <motion.div
            variants={item}
            className="mt-3 flex w-full flex-col items-center gap-2"
          >
            <div className="flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-beige" />
              <span className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-brownlabel">
                Detalhes do grande dia
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-beige" />
            </div>
            <p className="font-body text-sm leading-relaxed text-brownmid">
              Toque nos cartões para ver os detalhes e confirmar sua presença
            </p>
          </motion.div>

          {/* Grade de botões */}
          <motion.div
            variants={item}
            className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <ActionCard
              index={0}
              label="Local"
              icon={<MapPin size={28} strokeWidth={2} />}
              onClick={() => setModal("local")}
            />
            <ActionCard
              index={1}
              label="Traje"
              icon={<Shirt size={28} strokeWidth={2} />}
              onClick={() => setModal("traje")}
            />
            <ActionCard
              index={2}
              label="Presente"
              icon={<Gift size={28} strokeWidth={2} />}
              onClick={() => setModal("presente")}
            />
            <ActionCard
              index={3}
              label="Confirmar presença"
              icon={<HeartHandshake size={28} strokeWidth={2} />}
              highlight
              onClick={() => setModal("confirmar")}
            />
          </motion.div>

          {/* Mural de recadinhos */}
          <motion.button
            variants={item}
            type="button"
            onClick={() => setModal("recado")}
            whileHover="hover"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            className="group relative flex w-full items-center gap-4 overflow-hidden rounded-card border-2 border-beige bg-gradient-to-br from-white to-beige-light/60 p-4 text-left shadow-card"
          >
            {/* Coração grande e discreto ao fundo */}
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-4 -right-3 h-24 w-24 -rotate-12 text-beige/70"
            >
              <path d={HEART_PATH} fill="currentColor" />
            </svg>

            {/* Envelope com coraçõezinhos saindo de tempos em tempos */}
            <motion.span
              variants={{ hidden: { rotate: 0 }, show: { rotate: 0 }, hover: { rotate: -10 } }}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-beige-light text-caramel"
            >
              <Mail size={26} strokeWidth={2} />
              {[0, 1].map((i) => (
                <motion.svg
                  key={i}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1 h-3 w-3 text-caramel"
                  style={{ marginLeft: i === 0 ? -8 : 2 }}
                  animate={{ y: [4, -16], opacity: [0, 1, 0], scale: [0.6, 1, 0.8] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.6,
                    ease: "easeOut",
                    delay: 0.8 + i * 0.45,
                    repeatDelay: 1.4,
                  }}
                >
                  <path d={HEART_PATH} fill="currentColor" />
                </motion.svg>
              ))}
            </motion.span>

            <span className="relative flex-1">
              <span className="block font-display text-[17px] leading-tight text-browndark">
                Deixe um recadinho para o bebê
              </span>
              <span className="mt-1 block font-body text-sm leading-snug text-brownlabel">
                Escreva uma mensagem de carinho. Vamos guardar cada palavra para
                sempre 💌
              </span>
            </span>

            {/* Seta convidando ao toque */}
            <motion.span
              variants={{ hidden: { x: 0 }, show: { x: 0 }, hover: { x: 4 } }}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-browndark text-cream"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </motion.span>
          </motion.button>

          {/* Rodapé */}
          <motion.footer
            variants={item}
            className="mt-4 font-body italic text-sm text-brownlabel"
          >
            Com amor, mamãe e papai 🤎
          </motion.footer>

          {/* Crédito */}
          <motion.p
            variants={item}
            className="-mt-3 font-body text-[11px] text-brownlabel/60"
          >
            © {new Date().getFullYear()} larabytelab · Todos os direitos reservados
          </motion.p>
        </motion.main>

        <LocalModal open={modal === "local"} onClose={() => setModal(null)} />
        <TrajeModal open={modal === "traje"} onClose={() => setModal(null)} />
        <PresenteModal open={modal === "presente"} onClose={() => setModal(null)} />
        <ConfirmarModal
          open={modal === "confirmar"}
          onClose={() => setModal(null)}
        />
        <RecadoModal open={modal === "recado"} onClose={() => setModal(null)} />
      </MotionConfig>
    );
  }
);

export default MainPage;

function ActionCard({
  label,
  icon,
  onClick,
  highlight = false,
  index = 0,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  highlight?: boolean;
  index?: number;
}) {
  return (
    // Flutuação contínua e suave (escalonada por índice) no wrapper,
    // deixando o hover/tap por conta do botão para não conflitar.
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{
        repeat: Infinity,
        duration: 3.4 + index * 0.35,
        ease: "easeInOut",
        delay: index * 0.2,
      }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.04, y: -3 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={
          "flex min-h-[112px] w-full flex-col items-center justify-center gap-2 rounded-card border-2 p-4 shadow-card " +
          (highlight
            ? "border-browndark bg-browndark text-cream"
            : "border-beige bg-white text-browndark")
        }
      >
        <motion.span
          className={
            "flex h-11 w-11 items-center justify-center rounded-full " +
            (highlight
              ? "bg-white/15 text-cream"
              : "bg-beige-light text-caramel")
          }
          animate={{ rotate: [0, -8, 0, 8, 0] }}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut",
            delay: index * 0.3,
          }}
        >
          {icon}
        </motion.span>
        <span className="font-body text-sm font-semibold leading-tight">
          {label}
        </span>
      </motion.button>
    </motion.div>
  );
}

const HEART_PATH =
  "M12 21s-7-4.6-9.5-8.6C1 9.4 3 5.5 6.4 5.5 9 5.5 12 8.4 12 8.4s3-2.9 5.6-2.9C21 5.5 23 9.4 21.5 12.4 19 16.4 12 21 12 21z";

// Mesmos tons pastel dos balões do fundo (BalloonBackground).
const BALLOON_PINK = { body: "#E8C4CB", edge: "#D3A2AE" };
const BALLOON_BLUE = { body: "#C3D5E3", edge: "#A4BDD1" };

/** Balão preso atrás do ursinho do topo, balançando pelo cordão. */
function HeroBalloon({
  color,
  className,
  tilt,
  delay,
}: {
  color: { body: string; edge: string };
  className: string;
  tilt: number;
  delay: number;
}) {
  return (
    <motion.span
      aria-hidden="true"
      className={"absolute block w-9 " + className}
      style={{ originX: 0.5, originY: 1 }}
      animate={{ rotate: [tilt - 5, tilt + 5] }}
      transition={{
        repeat: Infinity,
        repeatType: "mirror",
        duration: 2.6,
        ease: "easeInOut",
        delay,
      }}
    >
      <svg viewBox="0 0 44 96" className="w-full">
        <path
          d="M22 3 C33 3 40 12 40 25 C40 39 30 49 22 51 C14 49 4 39 4 25 C4 12 11 3 22 3 Z"
          fill={color.body}
        />
        <path d="M22 51 L18 57 L26 57 Z" fill={color.edge} />
        <path
          d="M22 57 q5 9 0 19 q-5 10 0 20"
          fill="none"
          stroke={color.edge}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <ellipse cx="15" cy="17" rx="4" ry="7" fill="#FFFFFF" opacity="0.35" />
      </svg>
    </motion.span>
  );
}

/** Ursinho espiando por cima da cartinha, segurando um coração que pulsa. */
function PeekBearHeart() {
  return (
    <svg width="76" height="64" viewBox="0 0 120 100" aria-hidden="true">
      <circle cx="30" cy="30" r="16" fill="#C9A574" />
      <circle cx="90" cy="30" r="16" fill="#C9A574" />
      <circle cx="30" cy="30" r="8" fill="#8B6F52" />
      <circle cx="90" cy="30" r="8" fill="#8B6F52" />
      <circle cx="60" cy="58" r="36" fill="#C9A574" />
      <ellipse cx="60" cy="68" rx="20" ry="15" fill="#FAF6F0" />
      <circle cx="36" cy="66" r="6" fill="#E8B9A0" opacity="0.75" />
      <circle cx="84" cy="66" r="6" fill="#E8B9A0" opacity="0.75" />
      {/* Olhinhos fechados e sorridentes */}
      <path
        d="M42 52 q5 -6 10 0 M68 52 q5 -6 10 0"
        fill="none"
        stroke="#5C4433"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="60" cy="63" rx="5" ry="3.8" fill="#5C4433" />
      <path
        d="M60 67 v4 M60 71 c-4 5 -10 5 -12 0 M60 71 c4 5 10 5 12 0"
        fill="none"
        stroke="#5C4433"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Coração entre as patinhas */}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={{ scale: [1, 1.14, 1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", repeatDelay: 0.6 }}
      >
        <path
          d={HEART_PATH}
          transform="translate(44 72) scale(1.35)"
          fill="#B08968"
        />
      </motion.g>
      <ellipse cx="38" cy="92" rx="11" ry="8" fill="#C9A574" />
      <ellipse cx="82" cy="92" rx="11" ry="8" fill="#C9A574" />
    </svg>
  );
}
