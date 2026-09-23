"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Minus, Plus } from "lucide-react";
import Modal from "@/components/Modal";
import BearHead from "@/components/BearHead";
import { rsvpSchema } from "@/lib/validation";
import { getVisitorId, getStoredGift, setStoredGift } from "@/lib/visitor";
import { supabase } from "@/lib/supabase-browser";
import { isThrottled } from "@/lib/throttle";
import type { GiftSize } from "@/lib/event";

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

type State = "form" | "loading" | "success";

export default function ConfirmarModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [names, setNames] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(1);
  const [company, setCompany] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<State>("form");
  const [resultGift, setResultGift] = useState<GiftSize | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const visitorId = getVisitorId();
    const storedGift = getStoredGift();

    const payload = {
      names,
      phone,
      guests_count: guests,
      visitor_id: visitorId || null,
      gift_size: storedGift,
      company,
    };

    const parsed = rsvpSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && key !== "company") {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    // Honeypot: se veio conteúdo, finge sucesso sem gravar.
    if (parsed.data.company && parsed.data.company.length > 0) {
      setResultGift(storedGift ?? null);
      setState("success");
      return;
    }

    // Evita duplo clique (limite por aba, sem servidor).
    if (isThrottled("rsvp")) {
      setFormError("Aguarde alguns segundos antes de tentar de novo.");
      return;
    }

    setState("loading");
    try {
      const phoneDigits = parsed.data.phone.replace(/\D/g, "");
      let giftSize: GiftSize | null = parsed.data.gift_size ?? null;

      // Se ainda não há sugestão e temos visitor_id, sorteia agora (RPC atômico).
      if (!giftSize && parsed.data.visitor_id) {
        const { data: gift, error: giftErr } = await supabase.rpc("assign_gift", {
          p_visitor: parsed.data.visitor_id,
        });
        if (!giftErr && gift) giftSize = gift as GiftSize;
      }

      // upsert por telefone (não duplica se confirmar de novo).
      const { error } = await supabase.from("rsvps").upsert(
        {
          names: parsed.data.names,
          phone: phoneDigits,
          guests_count: parsed.data.guests_count,
          gift_size: giftSize,
          visitor_id: parsed.data.visitor_id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "phone" }
      );

      if (error) {
        setState("form");
        setFormError("Não foi possível confirmar. Tente novamente.");
        return;
      }

      if (giftSize) setStoredGift(giftSize);
      setResultGift(giftSize ?? storedGift ?? null);
      setState("success");
    } catch {
      setState("form");
      setFormError("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirmar presença">
      {state === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 text-center"
        >
          <div className="flex justify-center">
            <BearHead size={96} blush />
          </div>
          <p className="font-display text-2xl text-browndark">
            Oba! Sua presença está confirmada.
          </p>
          <p className="font-body text-brownlabel">
            Estamos muito felizes por ter você com a gente nesse momento tão especial!
          </p>
          {resultGift && (
            <div className="rounded-2xl border-2 border-beige bg-beige-light px-4 py-3">
              <p className="font-body text-sm text-brownlabel-deep">
                Sua sugestão de presente:{" "}
                <strong className="text-browndark">
                  Fralda tamanho {resultGift} + um mimo
                </strong>
              </p>
            </div>
          )}
          <button type="button" onClick={onClose} className="btn-pill w-full">
            Fechar
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Honeypot oculto */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="company">Deixe em branco</label>
            <input
              id="company"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="names"
              className="mb-1 block font-body font-semibold text-browndark"
            >
              Nome(s)
            </label>
            <textarea
              id="names"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              rows={3}
              required
              aria-invalid={!!errors.names}
              className="w-full rounded-2xl border-2 border-beige bg-white px-4 py-3 font-body text-browndark placeholder:text-brownlabel/60"
              placeholder="Ex.: Ana e João"
            />
            <p className="mt-1 font-body text-xs text-brownlabel">
              Digite o seu nome e o dos convidados que estarão presentes com você.
            </p>
            {errors.names && (
              <p className="mt-1 font-body text-sm text-red-700">{errors.names}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block font-body font-semibold text-browndark"
            >
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              required
              aria-invalid={!!errors.phone}
              className="w-full rounded-2xl border-2 border-beige bg-white px-4 py-3 font-body text-browndark placeholder:text-brownlabel/60"
              placeholder="(11) 99999-9999"
            />
            {errors.phone && (
              <p className="mt-1 font-body text-sm text-red-700">{errors.phone}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="guests"
              className="mb-1 block font-body font-semibold text-browndark"
            >
              Quantidade de pessoas
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Diminuir"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="btn-secondary h-12 w-12 !px-0"
              >
                <Minus size={18} strokeWidth={2.4} />
              </button>
              <input
                id="guests"
                type="number"
                min={1}
                value={guests}
                onChange={(e) =>
                  setGuests(Math.max(1, parseInt(e.target.value || "1", 10)))
                }
                className="h-12 w-20 rounded-2xl border-2 border-beige bg-white text-center font-body text-lg font-semibold text-browndark"
              />
              <button
                type="button"
                aria-label="Aumentar"
                onClick={() => setGuests((g) => g + 1)}
                className="btn-secondary h-12 w-12 !px-0"
              >
                <Plus size={18} strokeWidth={2.4} />
              </button>
            </div>
            {errors.guests_count && (
              <p className="mt-1 font-body text-sm text-red-700">
                {errors.guests_count}
              </p>
            )}
          </div>

          {formError && (
            <p className="font-body text-sm text-red-700" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="btn-pill w-full"
          >
            {state === "loading" ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Confirmando…
              </>
            ) : (
              "Confirmar presença"
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}
