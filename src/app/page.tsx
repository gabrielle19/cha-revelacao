"use client";

import EnvelopeReveal from "@/components/EnvelopeReveal";

export default function Page() {
  // A abertura do envelope roda em todo acesso; dentro dela já vive a MainPage.
  return <EnvelopeReveal />;
}
