"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  CalendarDays,
  Clock,
} from "lucide-react";
import Modal from "@/components/Modal";
import { EVENT } from "@/lib/event";

export default function LocalModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(EVENT.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Local">
      <div className="space-y-5">
        {/* Data e horário */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-beige-light px-3 py-1.5 font-body text-sm font-semibold text-brownlabel-deep">
            <CalendarDays size={16} strokeWidth={2.2} className="text-caramel" />
            {EVENT.dateLong}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-beige-light px-3 py-1.5 font-body text-sm font-semibold text-brownlabel-deep">
            <Clock size={16} strokeWidth={2.2} className="text-caramel" />
            às {EVENT.time}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <MapPin
            size={22}
            strokeWidth={2.2}
            className="mt-0.5 shrink-0 text-caramel"
          />
          <p className="font-body text-md font-semibold text-browndark">
            {EVENT.address}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border-2 border-beige bg-beige-light px-4 py-3">
          <AlertTriangle
            size={20}
            strokeWidth={2.2}
            className="mt-0.5 shrink-0 text-brownlabel-deep"
          />
          <p className="font-body text-sm text-brownlabel-deep">
            <strong className="text-browndark">Obs.:</strong> {EVENT.addressNote}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={EVENT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill w-full"
          >
            Ir para o Google Maps
            <ExternalLink size={18} strokeWidth={2.4} />
          </a>
          <button type="button" onClick={copyAddress} className="btn-secondary w-full">
            {copied ? (
              <>
                <Check size={18} strokeWidth={2.4} /> Endereço copiado!
              </>
            ) : (
              <>
                <Copy size={18} strokeWidth={2.4} /> Copiar endereço
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
