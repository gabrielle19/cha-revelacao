"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";
import Modal from "@/components/Modal";
import ScratchCard from "@/components/ScratchCard";
import { type GiftSize } from "@/lib/event";
import { supabase } from "@/lib/supabase-browser";
import {
  getVisitorId,
  getStoredGift,
  setStoredGift,
  getGiftScratched,
  setGiftScratched,
} from "@/lib/visitor";

type Phase = "loading" | "ready" | "revealed" | "error";

export default function PresenteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [size, setSize] = useState<GiftSize | null>(null);
  const [returning, setReturning] = useState(false); // já tinha raspado antes
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const stored = getStoredGift();
    const scratched = getGiftScratched();
    if (stored && scratched) {
      setSize(stored);
      setReturning(true);
      setPhase("revealed");
      return;
    }
    void loadGift(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadGift(stored: GiftSize | null) {
    setPhase("loading");
    if (stored) {
      setSize(stored);
      setPhase("ready");
      return;
    }
    const result = await fetchGift(getVisitorId());
    if (result) {
      setSize(result);
      setStoredGift(result);
      setPhase("ready");
    } else {
      setPhase("error");
    }
  }

  async function fetchGift(visitorId: string): Promise<GiftSize | null> {
    if (!visitorId) return null;
    try {
      const { data, error } = await supabase.rpc("assign_gift", {
        p_visitor: visitorId,
      });
      if (error) return null;
      return (data as GiftSize) ?? null;
    } catch {
      return null;
    }
  }

  function handleReveal() {
    if (phase === "revealed") return;
    setGiftScratched();
    setPhase("revealed");
    void celebrate();
  }

  async function celebrate() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(40);
    }
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FAF6F0", "#E8DCC8", "#C9A574", "#B08968", "#5C4433"],
        scalar: 0.9,
      });
    } catch {
      /* opcional */
    }
  }

  const title =
    phase === "revealed" && returning
      ? "Sua sugestão de presente"
      : "Raspe para descobrir sua sugestão de presente";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-beige-light">
          <Gift size={28} strokeWidth={2.2} className="text-caramel" />
        </div>

        {phase === "error" ? (
          <div className="space-y-4">
            <p className="font-body text-browndark">
              Não conseguimos preparar sua sugestão agora. Tente novamente.
            </p>
            <button
              type="button"
              className="btn-pill w-full"
              onClick={() => void loadGift(getStoredGift())}
            >
              Tentar de novo
            </button>
          </div>
        ) : (
          <>
            <ScratchCard
              revealed={phase === "revealed"}
              disabled={phase === "loading"}
              onReveal={handleReveal}
            >
              <div>
                {phase === "loading" ? (
                  <p className="font-body text-brownlabel">
                    Preparando sua sugestão…
                  </p>
                ) : (
                  <p className="font-body text-lg leading-snug text-browndark">
                    Fralda tamanho{" "}
                    <strong className="font-display text-2xl text-caramel">
                      {size}
                    </strong>{" "}
                    + um mimo de sua escolha
                  </p>
                )}
              </div>
            </ScratchCard>

            {phase === "revealed" ? (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-body text-brownlabel-deep"
                aria-live="polite"
              >
                Obrigado pelo carinho 💌. Estamos muito felizes por ter você com a gente nesse momento tão especial!
              </motion.p>
            ) : (
              <button
                type="button"
                onClick={handleReveal}
                disabled={phase === "loading"}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-caramel underline underline-offset-4 disabled:opacity-50"
              >
                <Sparkles size={16} strokeWidth={2.2} /> Revelar sem raspar
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
