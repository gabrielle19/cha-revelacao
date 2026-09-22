"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-pill no-print"
    >
      <Printer size={18} strokeWidth={2.2} /> Imprimir / Salvar PDF
    </button>
  );
}
