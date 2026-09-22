"use client";

import Modal from "@/components/Modal";
import { EVENT } from "@/lib/event";

const SWATCHES = [
  { name: "Branco", color: "#FFFFFF" },
  { name: "Off-white", color: "#FAF6F0" },
  { name: "Nude", color: "#E8DCC8" },
  { name: "Bege", color: "#D8C1A0" },
];

export default function TrajeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Traje">
      <div className="space-y-5">
        <p className="font-body text-lg font-semibold text-browndark">
          {EVENT.dressCode}
        </p>
        <p className="font-body text-brownlabel">
          Queremos todo mundo combinando com esse momento tão especial!
        </p>

        <div className="flex items-center gap-4 pt-1">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-2">
              <span
                className="h-12 w-12 rounded-full border-2 border-beige shadow-card"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              <span className="font-body text-xs text-brownlabel-deep">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
