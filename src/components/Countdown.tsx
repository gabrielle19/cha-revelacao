"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { EVENT } from "@/lib/event";

type Parts = { days: number; hours: number; minutes: number };

const TARGET = new Date(EVENT.dateISO).getTime();

/** Y-M-D no fuso de Brasília, para detectar "é hoje". */
function saoPauloDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

function computeParts(now: number): Parts {
  const diff = Math.max(0, TARGET - now);
  const totalMinutes = Math.floor(diff / 60000);
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}

export default function Countdown() {
  // Só calcula no cliente (evita erro de hidratação).
  const [now, setNow] = useState<number | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const started = now !== null && now >= TARGET;
  const isEventDayBefore =
    now !== null && !started && saoPauloDay(now) === saoPauloDay(TARGET);

  // Depois do evento
  if (started) {
    return (
      <p className="max-w-[38ch] font-body text-brownlabel-deep">
        O nosso segredo foi revelado — obrigado por celebrar esse momento com a
        gente!
      </p>
    );
  }

  // No dia, antes das 13h
  if (isEventDayBefore) {
    return (
      <p className="max-w-[38ch] font-display text-2xl leading-tight text-browndark">
        É hoje! O segredo será revelado a partir das 13h.
      </p>
    );
  }

  const parts = now === null ? null : computeParts(now);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-body text-xs uppercase tracking-[0.25em] text-brownlabel">
        Faltam
      </span>
      <div className="flex items-stretch justify-center gap-2">
        <Unit value={parts?.days} label="dias" reduce={!!reduce} />
        <Unit value={parts?.hours} label="horas" reduce={!!reduce} />
        <Unit value={parts?.minutes} label="min" reduce={!!reduce} />
      </div>
     
    </div>
  );
}

function Unit({
  value,
  label,
  reduce,
}: {
  value: number | undefined;
  label: string;
  reduce: boolean;
}) {
  const display = value === undefined ? "—" : String(value).padStart(2, "0");
  return (
    <div className="flex min-w-[64px] flex-col items-center rounded-card border-2 border-beige bg-white px-3 py-2 shadow-card">
      <div className="relative h-9 w-full overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={display}
            initial={reduce ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: -14, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center font-display text-2xl leading-none text-browndark"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-0.5 font-body text-[11px] text-brownlabel">{label}</span>
    </div>
  );
}
