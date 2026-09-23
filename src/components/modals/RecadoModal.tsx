"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Modal";
import BearHead from "@/components/BearHead";
import { messageSchema } from "@/lib/validation";
import { getVisitorId } from "@/lib/visitor";
import { supabase } from "@/lib/supabase-browser";
import { isThrottled } from "@/lib/throttle";

type Phase = "form" | "sending" | "done";

const MAX_NAME = 60;
const MAX_MSG = 400;

export default function RecadoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    onClose();
    // Reseta depois da animação de saída
    window.setTimeout(() => {
      if (phase === "done") {
        setPhase("form");
        setName("");
        setMessage("");
        setError(null);
      }
    }, 250);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = messageSchema.safeParse({
      author_name: name,
      message,
      visitor_id: getVisitorId() || null,
      company,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados.");
      return;
    }

    // Honeypot: se veio conteúdo, finge sucesso sem gravar.
    if (parsed.data.company && parsed.data.company.length > 0) {
      setPhase("done");
      return;
    }

    // Evita duplo clique (limite por aba, sem servidor).
    if (isThrottled("messages")) {
      setError("Aguarde alguns segundos antes de enviar de novo.");
      return;
    }

    setPhase("sending");
    try {
      const { error: insertError } = await supabase.from("messages").insert({
        author_name: parsed.data.author_name,
        message: parsed.data.message,
        visitor_id: parsed.data.visitor_id ?? null,
      });
      if (insertError) {
        setError("Não foi possível enviar. Tente novamente.");
        setPhase("form");
        return;
      }
      setPhase("done");
    } catch {
      setError("Não foi possível enviar. Tente novamente.");
      setPhase("form");
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Deixe um recadinho para o bebê">
      {phase === "done" ? (
        <motion.div
          className="space-y-4 text-center"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          aria-live="polite"
        >
          <div className="mx-auto w-fit">
            <BearHead size={84} blush />
          </div>
          <p className="font-body text-lg text-browndark">
            Seu recadinho foi guardado com muito carinho. Obrigado!
          </p>
          <button type="button" className="btn-pill w-full" onClick={handleClose}>
            Fechar
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-body text-sm text-brownlabel">
            Uma mensagem de carinho que vamos guardar para sempre.
          </p>

          {/* Honeypot oculto */}
          <input
            type="text"
            name="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          <div>
            <label
              htmlFor="recado-nome"
              className="mb-1 block font-body text-sm font-semibold text-browndark"
            >
              Seu nome
            </label>
            <input
              id="recado-nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
              maxLength={MAX_NAME}
              required
              className="w-full rounded-card border-2 border-beige bg-white px-4 py-3 font-body text-browndark outline-none focus:border-caramel"
              placeholder="Como você quer ser lembrado(a)"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="recado-msg"
                className="font-body text-sm font-semibold text-browndark"
              >
                Seu recadinho
              </label>
              <span className="font-body text-xs text-brownlabel">
                {message.length}/{MAX_MSG}
              </span>
            </div>
            <textarea
              id="recado-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
              maxLength={MAX_MSG}
              required
              rows={4}
              className="w-full resize-none rounded-card border-2 border-beige bg-white px-4 py-3 font-body text-browndark outline-none focus:border-caramel"
              placeholder="Mal posso esperar para te conhecer e te encher de carinho!"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={phase === "sending"}
            className="btn-pill w-full"
          >
            {phase === "sending" ? "Enviando…" : "Enviar recadinho"}
          </button>
        </form>
      )}
    </Modal>
  );
}
