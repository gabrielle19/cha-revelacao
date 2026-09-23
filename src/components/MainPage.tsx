"use client";

import { motion } from "framer-motion";
import { MapPin, Shirt, Gift, HeartHandshake, Mail } from "lucide-react";
import { useState } from "react";
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

export default function MainPage({
  entrance = true,
  titleRef,
  revealTitle = false,
}: {
  entrance?: boolean;
  /** Referência para o <h1> do título, usada pela abertura (SplitText). */
  titleRef?: React.Ref<HTMLHeadingElement>;
  /** Quando true, o título entra escondido para ser revelado via GSAP. */
  revealTitle?: boolean;
}) {
  const [modal, setModal] = useState<ModalKey>(null);

  return (
    <>
      <DecorativeFrame />
      <motion.main
        variants={container}
        initial={entrance ? "hidden" : "show"}
        animate="show"
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

        {/* Ursinho flutuante */}
        <motion.div
          variants={item}
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        >
          <BearHead size={120} blush />
        </motion.div>

        {/* Título */}
        {revealTitle ? (
          // Entra escondido: a abertura do envelope revela letra a letra (SplitText).
          <h1
            ref={titleRef}
            style={{ visibility: "hidden" }}
            className="font-display text-4xl leading-tight text-browndark sm:text-5xl"
          >
            {EVENT.babyOptions.a}
            <br />
            <span className="font-body text-2xl italic text-brownlabel">ou</span>{" "}
            {EVENT.babyOptions.b}?
          </h1>
        ) : (
          <motion.h1
            variants={item}
            className="font-display text-4xl leading-tight text-browndark sm:text-5xl"
          >
            <motion.span
              className="inline-block"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              {EVENT.babyOptions.a}
              <br />
              <span className="font-body text-2xl italic text-brownlabel">
                ou
              </span>{" "}
              {EVENT.babyOptions.b}?
            </motion.span>
          </motion.h1>
        )}

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

       {/* Texto na voz do bebê */}
<motion.p
  variants={item}
  className="font-body italic leading-relaxed text-browndark"
>
  Antes mesmo de chegar, já existe muito amor esperando por mim. Ter você pertinho vai deixar esse momento ainda mais especial 🤎
</motion.p>

{/* Chamada para os detalhes */}
<motion.p
  variants={item}
  className="mt-4 font-body italic text-md leading-relaxed text-brownmid"
>
  Toque nos ícones abaixo para conferir todos os detalhes e confirmar sua presença. 🤎
</motion.p>

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
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className="flex w-full items-center gap-4 rounded-card border-2 border-beige bg-white p-4 text-left shadow-card"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-beige-light text-caramel">
            <Mail size={26} strokeWidth={2} />
          </span>
          <span>
            <span className="block font-body font-semibold text-md leading-tight text-browndark">
              Deixe um recadinho para o bebê 💌
            </span>
            <span className="mt-0.5 block font-body text-sm text-brownlabel">
              Uma mensagem de carinho que vamos guardar para sempre
            </span>
          </span>
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
    </>
  );
}

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
