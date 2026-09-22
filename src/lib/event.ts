/** Dados fixos do evento, reutilizados em várias telas. */

export const EVENT = {
  title: "Chá Revelação",
  babyOptions: { a: "Bernardo", b: "Maria Júlia" },
  dateLong: "21 de novembro de 2026",
  time: "13h",
  dateShort: "21 · 11 · 2026 — 13h",
  // Data-alvo com fuso de Brasília (usada na contagem regressiva).
  dateISO: "2026-11-21T13:00:00-03:00",
  address: "Av. Pedro de Souza Lopes, 4965 — Jardim Cristian — Guarulhos/SP",
  addressNote:
    "o número 4965 fica em uma pequena entrada de estrada de terra da Av. Pedro de Souza Lopes.",
  mapsUrl: "https://maps.app.goo.gl/Von6z5ij7GrCpaePA?g_st=ic",
  dressCode: "Roupas off white, branca, nude ou bege (tons claros).",
} as const;

export const GIFT_SIZES = ["P", "M", "G", "GG"] as const;
export type GiftSize = (typeof GIFT_SIZES)[number];

export const VERSE = {
  text: "Herança do Senhor são os filhos; o fruto do ventre, seu galardão.",
  ref: "Salmos 127:3",
} as const;
